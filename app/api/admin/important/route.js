import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "app", "data", "important.json");

export async function GET() {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw || "[]");
    return Response.json({ ok: true, data });
  } catch (e) {
    return Response.json({ ok: false, message: "Could not read important." }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    // Expect shape: [{ email: "..." }]
    if (!Array.isArray(body)) {
      return Response.json({ ok: false, message: "Invalid payload." }, { status: 400 });
    }

    await fs.writeFile(filePath, JSON.stringify(body, null, 2), "utf8");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, message: "Could not save important." }, { status: 500 });
  }
}
