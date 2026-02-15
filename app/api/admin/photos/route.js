import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

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
  if (!isAdmin(req)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  try {
    await fs.mkdir(PHOTOS_DIR, { recursive: true });

    const files = await fs.readdir(PHOTOS_DIR);
    const images = files
      .filter(isImageName)
      .sort((a, b) => a.localeCompare(b))
      .map((f) => ({
        name: f,
        url: `/images/photos/${f}`,
      }));

    return NextResponse.json({ ok: true, data: images });
  } catch (e) {
    return NextResponse.json({ ok: false, message: "Could not list photos." }, { status: 500 });
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

    await fs.unlink(path.join(PHOTOS_DIR, name));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: "Delete failed." }, { status: 500 });
  }
}
