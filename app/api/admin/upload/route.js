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

// Keep folder names safe: "Larry’s Spot" -> "larrys-spot"
function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function extFromType(mime) {
  const m = (mime || "").toLowerCase();
  if (m.includes("png")) return ".png";
  if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
  if (m.includes("webp")) return ".webp";
  if (m.includes("gif")) return ".gif";
  return "";
}

export async function POST(req) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();

    const file = form.get("file");
    const scopeRaw = form.get("scope"); // "projects" | "contact"
    const slugRaw = form.get("slug");   // project slug

    const scope = scopeRaw === "contact" ? "contact" : "projects";
    const slug = slugify(String(slugRaw || "misc")) || "misc";

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ ok: false, message: "Missing file." }, { status: 400 });
    }

    const mime = file.type || "";
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ ok: false, message: "Only image uploads are allowed." }, { status: 400 });
    }

    const originalName = file.name || "image";
    const originalExt = path.extname(originalName);
    const ext = originalExt || extFromType(mime) || ".png";

    // Save into: /public/images/uploads/<scope>/<slug>/
    const relDir = path.join("public", "images", "uploads", scope, slug);
    const absDir = path.join(process.cwd(), relDir);
    await fs.mkdir(absDir, { recursive: true });

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const absPath = path.join(absDir, filename);

    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absPath, buf);

    // Browser path:
    const publicPath = `/images/uploads/${scope}/${slug}/${filename}`;

    return NextResponse.json({ ok: true, path: publicPath });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Upload failed." },
      { status: 500 }
    );
  }
}
