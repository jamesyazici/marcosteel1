import crypto from "crypto";
import { NextResponse } from "next/server";

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export async function POST(req) {
  try {
    const { password } = await req.json();
    const adminPass = process.env.ADMIN_PASSWORD || "";
    const secret = process.env.ADMIN_COOKIE_SECRET || "";

    if (!adminPass || !secret) {
      return NextResponse.json(
        { ok: false, message: "Server missing ADMIN env vars." },
        { status: 500 }
      );
    }

    if ((password || "") !== adminPass) {
      return NextResponse.json(
        { ok: false, message: "Invalid password." },
        { status: 401 }
      );
    }

    // Create token payload and signature
    const payload = `${Date.now()}:${crypto.randomBytes(16).toString("hex")}`;
    const sig = sign(payload, secret);
    const token = `${payload}.${sig}`;

    const res = NextResponse.json({ ok: true });

    // httpOnly cookie so JS can't read it
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Bad request." },
      { status: 400 }
    );
  }
}
