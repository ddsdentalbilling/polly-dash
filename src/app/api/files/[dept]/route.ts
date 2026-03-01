import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function GET(
  request: Request,
  { params }: { params: { dept: string } }
) {
  const { dept } = params;

  const snapshot = await db
    .collection("files")
    .where("department", "==", dept)
    .orderBy("uploadedAt", "desc")
    .get();

  const files = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({ files });
}
