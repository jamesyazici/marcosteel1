// import fs from "fs/promises";
// import path from "path";
// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     const filePath = path.join(process.cwd(), "data", "projects.json");
//     const raw = await fs.readFile(filePath, "utf8");
//     const json = JSON.parse(raw || "[]");
//     // return NextResponse.json({ ok: true, projects: json });
//   } catch (err) {
//     return NextResponse.json(
//       { ok: false, message: "Could not read projects." },
//       { status: 500 }
//     );
//   }
// }

import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const PROJECTS_PATH = path.join(process.cwd(), "app", "data", "projects.json");

export async function GET() {
  try {
    const raw = await fs.readFile(PROJECTS_PATH, "utf8");
    const json = JSON.parse(raw || "[]");
    return NextResponse.json({ ok: true, data: Array.isArray(json) ? json : [] });
  } catch {
    return NextResponse.json({ ok: false, data: [] }, { status: 500 });
  }
}
