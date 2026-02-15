import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "app", "data", "homePosters.json");

export async function GET() {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return NextResponse.json({ ok: true, data: JSON.parse(data) });
  } catch {
    return NextResponse.json({ ok: false, data: {} });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message });
  }
}
