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

const UPCOMING_PATH = path.join(process.cwd(), "app", "data", "upcoming.json");

export async function GET(req) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await fs.readFile(UPCOMING_PATH, "utf8");
    const json = JSON.parse(raw || "[]");
    return NextResponse.json({ ok: true, data: Array.isArray(json) ? json : [] });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not read upcoming." }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : body?.items;

    if (!Array.isArray(items)) {
      return NextResponse.json({ ok: false, message: "Expected an array." }, { status: 400 });
    }

    for (const it of items) {
      if (!it || typeof it.slug !== "string" || !it.slug.trim()) {
        return NextResponse.json({ ok: false, message: "Each poster must have a non-empty slug." }, { status: 400 });
      }
      if (!it.title || typeof it.title !== "string") {
        return NextResponse.json({ ok: false, message: "Each poster must have a title." }, { status: 400 });
      }
      if (!it.image || typeof it.image !== "string") {
        return NextResponse.json({ ok: false, message: "Each poster must have an image path." }, { status: 400 });
      }
    }

    await fs.writeFile(UPCOMING_PATH, JSON.stringify(items, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not save upcoming." }, { status: 500 });
  }
}

export async function POST(req) {
  return PUT(req);
}
