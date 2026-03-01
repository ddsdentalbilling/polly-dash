import { NextRequest, NextResponse } from "next/server";
import { getBucket, getDb } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: { dept: string; fileId: string } }
) {
  try {
    const { dept, fileId } = params;

    const docRef = getDb().collection("files").doc(fileId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const data = doc.data();
    if (data?.department !== dept) {
      return NextResponse.json({ error: "File not in this department" }, { status: 404 });
    }

    const objectName = data.objectName;
    if (!objectName) {
      return NextResponse.json({ error: "Invalid file record" }, { status: 500 });
    }

    // Generate signed URL valid for 1 hour
    const [url] = await getBucket().file(objectName).getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
