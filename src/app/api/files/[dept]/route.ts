import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function GET(
  request: Request,
  { params }: { params: { dept: string } }
) {
  try {
    const { dept } = params;

    const snapshot = await getDb()
      .collection("files")
      .where("department", "==", dept)
      .orderBy("uploadedAt", "desc")
      .get();

    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("List files error:", error);
    // If it's an index error, the message will contain the creation link
    return NextResponse.json(
      { error: "Failed to list files", details: error.message },
      { status: 500 }
    );
  }
}
