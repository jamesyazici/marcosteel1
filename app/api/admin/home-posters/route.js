import crypto from "crypto";
import { NextResponse } from "next/server";
import { readBlob, writeBlob } from "@/lib/blobStorage";
import homePostersData from "@/app/data/homePosters.json";

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

const DEFAULT_HOME_POSTERS = {
  left: { image: "", link: "" },
  right: { image: "", link: "" },
};

export async function GET(req) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const data = await readBlob("homePosters.json");
    const parsed = JSON.parse(data);
    
    // Ensure it's the right shape (object with left/right, not an array)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ ok: true, data: homePostersData || DEFAULT_HOME_POSTERS });
    }
    
    return NextResponse.json({ ok: true, data: parsed });
  } catch {
    return NextResponse.json({ ok: true, data: homePostersData || DEFAULT_HOME_POSTERS });
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
    await writeBlob("homePosters.json", JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message });
  }
}

export async function POST(req) {
  return PUT(req);
}
