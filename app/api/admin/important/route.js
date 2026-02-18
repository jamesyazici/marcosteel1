import crypto from "crypto";
import { NextResponse } from "next/server";
import { readBlob, writeBlob } from "@/lib/blobStorage";
import importantData from "@/app/data/important.json";

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

export async function GET(req) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const raw = await readBlob("important.json");
    const json = JSON.parse(raw || "[]");
    
    // If blob has data, use it; otherwise fall back to imported data
    const data = Array.isArray(json) && json.length > 0 ? json : importantData;
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: true, data: importantData });
  }
}

export async function PUT(req) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { ok: false, message: "Invalid payload." },
        { status: 400 }
      );
    }

    await writeBlob("important.json", JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: "Could not save important." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  return PUT(req);
}
