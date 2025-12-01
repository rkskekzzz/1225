import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");

    if (!authToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // 토큰 검증 (간단하게 디코딩만 수행)
    try {
      const username = Buffer.from(authToken.value, "base64").toString("utf-8");
      return NextResponse.json({ authenticated: true, username });
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
