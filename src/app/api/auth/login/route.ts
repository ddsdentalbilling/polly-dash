import { NextRequest, NextResponse } from "next/server";

function getSessionToken(): string {
  const password = process.env.DASH_PASSWORD || "polly2026!";
  let hash = 0;
  const str = `dash_${password}_session`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `s_${Math.abs(hash).toString(36)}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = body.password || "";
  const expected = process.env.DASH_PASSWORD || "polly2026!";

  if (password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("dash_session", getSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
