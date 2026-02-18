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

const BLOB_FILENAME = "about.json";

function normalizePayload(body) {
  const obj = Array.isArray(body) ? body?.[0] : body;
  const safe = {
    photo: String(obj?.photo || "").trim(),
    paragraph: String(obj?.paragraph || ""),
    links: Array.isArray(obj?.links)
      ? obj.links.slice(0, 4).map((x) => ({
          label: String(x?.label || "").trim(),
          url: String(x?.url || "").trim(),
        }))
      : [],
  };

  // Ensure exactly 4 link slots exist
  while (safe.links.length < 4) safe.links.push({ label: "", url: "" });
  safe.links = safe.links.slice(0, 4);

  return [safe];
}

export async function GET(req) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await readBlob(BLOB_FILENAME);
    const json = JSON.parse(raw || "[]");
    const first = Array.isArray(json) && json.length ? json : normalizePayload({});
    return NextResponse.json({ ok: true, data: first });
  } catch {
    // If file missing or invalid, return a safe default
    return NextResponse.json({
      ok: true,
      data: normalizePayload({}),
    });
  }
}

export async function PUT(req) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const payload = normalizePayload(body);

    await writeBlob(BLOB_FILENAME, JSON.stringify(payload, null, 2));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not save about." }, { status: 500 });
  }
}

export async function POST(req) {
  return PUT(req);
}
