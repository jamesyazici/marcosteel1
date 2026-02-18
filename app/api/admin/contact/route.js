import crypto from "crypto";
import { NextResponse } from "next/server";
import { readBlob, writeBlob } from "@/lib/blobStorage";
import contactData from "@/app/data/contact.json";

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
    const raw = await readBlob("contact.json");
    const json = JSON.parse(raw || "{}");
    
    // If blob has data, use it; otherwise fall back to imported data
    const data =
      json && typeof json === "object" && Object.keys(json).length > 0
        ? json
        : contactData;
    
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: true, data: contactData });
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
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, message: "Invalid payload." },
        { status: 400 }
      );
    }

    await writeBlob("contact.json", JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: "Could not save contact." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  return PUT(req);
}
