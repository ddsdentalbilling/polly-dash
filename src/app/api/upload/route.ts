import { NextRequest, NextResponse } from "next/server";
import { getBucket, getDb } from "@/lib/firebase";
import { v4 as uuid } from "uuid";

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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectName = `${department}/${Date.now()}-${uuid()}-${safeName}`;

    const uploaded = getBucket().file(objectName);
    await uploaded.save(buffer, {
      metadata: {
        contentType: file.type || "application/octet-stream",
      },
    });

    const docRef = await getDb().collection("files").add({
      department,
      name: safeName,
      objectName,
      size: buffer.length,
      contentType: file.type || "application/octet-stream",
      uploadedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      file: {
        id: docRef.id,
        name: safeName,
        department,
        size: buffer.length,
        uploadedAt: new Date().toISOString(),
        objectName,
      },
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}