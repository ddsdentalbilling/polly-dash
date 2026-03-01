import { NextRequest, NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

const WORKSPACE = process.env.WORKSPACE_DIR || path.join(process.env.HOME || "/home/nina", ".openclaw", "workspace");
const VALID_DEPARTMENTS = ["operations", "it", "finance", "hr", "marketing-sales"];

export async function GET(
  _request: NextRequest,
  { params }: { params: { dept: string } }
) {
  const { dept } = params;

  if (!VALID_DEPARTMENTS.includes(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }

  const uploadDir = path.join(WORKSPACE, "departments", dept, "uploads");

  try {
    const entries = await readdir(uploadDir);
    const files = await Promise.all(
      entries
        .filter((name) => !name.startsWith("."))
        .map(async (name) => {
          const filePath = path.join(uploadDir, name);
          const stats = await stat(filePath);
          return {
            name,
            size: stats.size,
            uploadedAt: stats.mtime.toISOString(),
            type: path.extname(name).slice(1) || "unknown",
          };
        })
    );

    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ department: dept, files });
  } catch {
    return NextResponse.json({ department: dept, files: [] });
  }
}
