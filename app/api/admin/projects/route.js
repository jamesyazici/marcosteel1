import crypto from "crypto";
import { NextResponse } from "next/server";
import { readBlob, writeBlob } from "@/lib/blobStorage";

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

const BLOB_FILENAME = "projects.json";

export async function GET(req) {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const raw = await readBlob(BLOB_FILENAME);
    const json = JSON.parse(raw || "[]");

    // IMPORTANT: admin UI expects { ok: true, data: [...] }
    return NextResponse.json({ ok: true, data: Array.isArray(json) ? json : [] });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not read projects." },
      { status: 500 }
    );
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

    // Admin UI sends the array directly, but allow { projects: [...] } too
    const projects = Array.isArray(body) ? body : body?.projects;

    if (!Array.isArray(projects)) {
      return NextResponse.json(
        { ok: false, message: "Expected an array of projects." },
        { status: 400 }
      );
    }

    // Minimal validation: ensure slug exists and is string
    for (const p of projects) {
      if (!p || typeof p.slug !== "string" || !p.slug.trim()) {
        return NextResponse.json(
          { ok: false, message: "Each project must have a non-empty slug." },
          { status: 400 }
        );
      }
    }

    await writeBlob(BLOB_FILENAME, JSON.stringify(projects, null, 2));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not save projects." },
      { status: 500 }
    );
  }
}

// Optional: keep POST working if anything else calls it
export async function POST(req) {
  return PUT(req);
}
