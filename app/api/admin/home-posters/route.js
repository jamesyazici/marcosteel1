import { NextResponse } from "next/server";
import { readBlob, writeBlob } from "@/lib/blobStorage";

const BLOB_FILENAME = "homePosters.json";

export async function GET() {
  try {
    const data = await readBlob(BLOB_FILENAME);
    return NextResponse.json({ ok: true, data: JSON.parse(data) });
  } catch {
    return NextResponse.json({ ok: false, data: {} });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    await writeBlob(BLOB_FILENAME, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message });
  }
}
