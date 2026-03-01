import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

export async function GET(
  request: Request,
  { params }: { params: { dept: string } }
) {
  const { dept } = params;

  const snapshot = await getDb()
    .collection("files")
    .where("department", "==", dept)
    .orderBy("uploadedAt", "desc")
    .get();

  const files = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({ files });
}
