import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const WORKSPACE = process.env.WORKSPACE_DIR || path.join(process.env.HOME || "/home/nina", ".openclaw", "workspace");
const VALID_DEPARTMENTS = ["operations", "it", "finance", "hr", "marketing-sales"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const department = formData.get("department") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!department || !VALID_DEPARTMENTS.includes(department)) {
      return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }

    const uploadDir = path.join(WORKSPACE, "departments", department, "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(uploadDir, safeName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      file: {
        name: safeName,
        size: buffer.length,
        department,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
