import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readBlob, writeBlob } from "@/lib/blobStorage";
import photosData from "@/app/data/photos.json";

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}
function safeEqual(a, b) {
  const aBuf = Buffer.from(a || "", "utf8");
  const bBuf = Buffer.from(b || "", "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
function isAdmin(req) {
  const token = req.cookies.get("admin_token")?.value;
  const secret = process.env.ADMIN_COOKIE_SECRET || "";
  if (!token || !secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;
  const expected = sign(payload, secret);
  return safeEqual(sig, expected);
}

const PHOTOS_DIR = path.join(process.cwd(), "public", "images", "photos");

function isImageName(name) {
  const s = String(name || "").toLowerCase();
  return s.endsWith(".jpg") || s.endsWith(".jpeg") || s.endsWith(".png") || s.endsWith(".webp") || s.endsWith(".gif");
}

function safeBaseName(name) {
  // prevents path traversal
  return path.basename(String(name || ""));
}

export async function GET(req) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Try to read from blob storage first (user-edited data)
    const raw = await readBlob("photos.json");
    const json = JSON.parse(raw || "[]");
    
    // If blob has data, use it
    if (Array.isArray(json) && json.length > 0) {
      return NextResponse.json({ ok: true, data: json });
    }
    
    // Otherwise, fall back to the imported data
    const data = Array.isArray(photosData) ? photosData : [];
    return NextResponse.json({ ok: true, data });
  } catch {
    // Fall back to imported data if anything fails
    const data = Array.isArray(photosData) ? photosData : [];
    return NextResponse.json({ ok: true, data });
  }
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  try {
    await fs.mkdir(PHOTOS_DIR, { recursive: true });

    const form = await req.formData();
    const file = form.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ ok: false, message: "Missing file." }, { status: 400 });
    }

    const original = safeBaseName(file.name || "upload");
    const ext = path.extname(original).toLowerCase();

    if (![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
      return NextResponse.json({ ok: false, message: "Unsupported image type." }, { status: 400 });
    }

    const id = crypto.randomBytes(8).toString("hex");
    const filename = `${Date.now()}-${id}${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(path.join(PHOTOS_DIR, filename), buf);

    // Read current photos from blob, add new one, write back
    try {
      const raw = await readBlob("photos.json");
      let photos = JSON.parse(raw || "[]");
      if (!Array.isArray(photos)) photos = [];

      // Add new photo entry
      photos.push({
        name: filename,
        url: `/images/photos/${filename}`,
        date: new Date().toISOString().split("T")[0],
      });

      // Write to blob
      await writeBlob("photos.json", JSON.stringify(photos, null, 2));

      // Revalidate the photos page
      try {
        revalidatePath("/photos");
      } catch (e) {
        // revalidatePath may fail in some contexts, continue anyway
      }
    } catch (e) {
      console.error("Could not update blob after upload:", e?.message);
    }

    return NextResponse.json({ ok: true, name: filename, url: `/images/photos/${filename}` });
  } catch (e) {
    return NextResponse.json({ ok: false, message: "Upload failed." }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const name = safeBaseName(searchParams.get("name") || "");

    if (!name || !isImageName(name)) {
      return NextResponse.json({ ok: false, message: "Invalid name." }, { status: 400 });
    }

    // Remove from filesystem
    await fs.unlink(path.join(PHOTOS_DIR, name));

    // Read current photos from blob, remove this one, write back
    try {
      const raw = await readBlob("photos.json");
      let photos = JSON.parse(raw || "[]");
      if (!Array.isArray(photos)) photos = [];

      // Filter out the deleted photo
      photos = photos.filter((p) => p.name !== name);

      // Write to blob
      await writeBlob("photos.json", JSON.stringify(photos, null, 2));

      // Revalidate the photos page
      try {
        revalidatePath("/photos");
      } catch (e) {
        // revalidatePath may fail in some contexts, continue anyway
      }
    } catch (e) {
      console.error("Could not update blob after delete:", e?.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: "Delete failed." }, { status: 500 });
  }
}

export async function PUT(req) {
  console.log(`[/api/admin/photos PUT] Request received`);
  
  if (!isAdmin(req)) {
    console.log(`[/api/admin/photos PUT] ❌ Auth check failed`);
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    console.log(`[/api/admin/photos PUT] Request body received, type: ${Array.isArray(body) ? 'array' : typeof body}`);

    // Admin UI sends the array directly, but allow { photos: [...] } too
    const photos = Array.isArray(body) ? body : body?.photos;
    console.log(`[/api/admin/photos PUT] Photos count: ${Array.isArray(photos) ? photos.length : 'N/A'}`);

    if (!Array.isArray(photos)) {
      console.log(`[/api/admin/photos PUT] ❌ Invalid payload - not an array`);
      return NextResponse.json(
        { ok: false, message: "Expected an array of photos." },
        { status: 400 }
      );
    }

    console.log(`[/api/admin/photos PUT] Validation passed. Calling writeBlob...`);
    await writeBlob("photos.json", JSON.stringify(photos, null, 2));
    console.log(`[/api/admin/photos PUT] ✅ Successfully saved to blob`);

    // Revalidate server-rendered pages that depend on photos.json so changes show immediately
    try {
      revalidatePath("/photos");
      revalidatePath("/");
      console.log(`[/api/admin/photos PUT] ✅ Revalidated paths`);
    } catch (e) {
      console.log(`[/api/admin/photos PUT] Could not revalidate paths:`, e?.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[/api/admin/photos PUT] ❌ Error:`, err?.message || err);
    console.error(`[/api/admin/photos PUT] Full error:`, err);
    return NextResponse.json(
      { ok: false, message: err?.message || "Could not save photos." },
      { status: 500 }
    );
  }
}
