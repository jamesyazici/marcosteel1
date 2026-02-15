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

function extFromTypeOrName(file) {
  const name = String(file?.name || "");
  const byName = (name.match(/\.[a-z0-9]+$/i) || [""])[0].toLowerCase();
  if (byName) return byName;

  const t = String(file?.type || "").toLowerCase();
  if (t.includes("jpeg")) return ".jpg";
  if (t.includes("png")) return ".png";
  if (t.includes("webp")) return ".webp";
  if (t.includes("gif")) return ".gif";
  return "";
}

function safeBaseName(name) {
  // remove extension and sanitize
  const base = String(name || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return base || "photo";
}

async function uniqueName(base, ext) {
  let n = 1;
  let candidate = `${base}${ext}`;
  while (true) {
    try {
      await fs.access(path.join(PHOTOS_DIR, candidate));
      n += 1;
      candidate = `${base}-${n}${ext}`;
    } catch {
      return candidate;
    }
  }
}

export async function POST(req) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await fs.mkdir(PHOTOS_DIR, { recursive: true });

    const form = await req.formData();
    const file = form.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ ok: false, message: "Missing file." }, { status: 400 });
    }

    const ext = extFromTypeOrName(file);
    if (!ext || ![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
      return NextResponse.json({ ok: false, message: "Unsupported image type." }, { status: 400 });
    }

    const base = safeBaseName(file.name);
    const filename = await uniqueName(base, ext === ".jpeg" ? ".jpg" : ext);

    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(PHOTOS_DIR, filename), buf);

    // what the browser will use
    return NextResponse.json({ ok: true, name: filename, path: `/images/photos/${filename}` });
  } catch {
    return NextResponse.json({ ok: false, message: "Upload failed." }, { status: 500 });
  }
}
