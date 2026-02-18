import { NextResponse } from "next/server";
import { readBlob, writeBlob } from "@/lib/blobStorage";

const BLOB_FILENAME = "homePosters.json";

const DEFAULT_HOME_POSTERS = {
  left: { image: "", link: "" },
  right: { image: "", link: "" },
};

export async function GET() {
  try {
    const data = await readBlob(BLOB_FILENAME);
    const parsed = JSON.parse(data);
    
    // Ensure it's the right shape (object with left/right, not an array)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ ok: true, data: DEFAULT_HOME_POSTERS });
    }
    
    return NextResponse.json({ ok: true, data: parsed });
  } catch {
    return NextResponse.json({ ok: true, data: DEFAULT_HOME_POSTERS });
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
