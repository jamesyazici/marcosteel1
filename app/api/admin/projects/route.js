import crypto from "crypto";
import { NextResponse } from "next/server";
import { readBlob, writeBlob } from "@/lib/blobStorage";
import projectsData from "@/app/data/projects.json";

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
    // Try to read from blob storage first (user-edited data)
    const raw = await readBlob("projects.json");
    const json = JSON.parse(raw || "[]");
    
    // If blob has data, use it
    if (Array.isArray(json) && json.length > 0) {
      return NextResponse.json({ ok: true, data: json });
    }
    
    // Otherwise, fall back to the imported data
    const data = Array.isArray(projectsData) ? projectsData : [];
    return NextResponse.json({ ok: true, data });
  } catch {
    // Fall back to imported data if anything fails
    const data = Array.isArray(projectsData) ? projectsData : [];
    return NextResponse.json({ ok: true, data });
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

    await writeBlob("projects.json", JSON.stringify(projects, null, 2));

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
