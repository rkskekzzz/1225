import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

// 로컬 테스트용 기본 계정들 (Supabase 없이도 작동)
const LOCAL_USERS = [
  { username: "admin", password: "password" },
  { username: "test", password: "test123" },
];

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    let isAuthenticated = false;

    // 1. 먼저 Supabase에서 사용자 조회 시도
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

      if (user && !error) {
        isAuthenticated = true;
      }
    } catch (supabaseError) {
      // Supabase 연결 실패 시 로컬 계정으로 fallback
      console.log("Supabase 연결 실패, 로컬 계정으로 시도합니다.");
    }

    // 2. Supabase에서 찾지 못했거나 연결 실패 시 로컬 계정 확인
    if (!isAuthenticated) {
      const localUser = LOCAL_USERS.find(
        (u) => u.username === username && u.password === password
      );

      if (localUser) {
        isAuthenticated = true;
      }
    }

    // 3. 인증 실패
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 쿠키 설정 (간단한 인증 토큰)
    const cookieStore = await cookies();
    cookieStore.set("auth-token", Buffer.from(username).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    return NextResponse.json({ success: true, username });
  } catch (error) {
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
