import { readBlob, writeBlob } from "@/lib/blobStorage";

const BLOB_FILENAME = "contact.json";

export async function GET() {
  try {
    const raw = await readBlob(BLOB_FILENAME);
    const data = JSON.parse(raw || "[]");
    return Response.json({ ok: true, data });
  } catch (e) {
    return Response.json({ ok: false, message: "Could not read contact." }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    // Expect shape: [{ name, phone, email, picture }]
    if (!Array.isArray(body)) {
      return Response.json({ ok: false, message: "Invalid payload." }, { status: 400 });
    }

    await writeBlob(BLOB_FILENAME, JSON.stringify(body, null, 2));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, message: "Could not save contact." }, { status: 500 });
  }
}
