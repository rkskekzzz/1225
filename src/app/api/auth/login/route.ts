import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

// 기본 관리자 계정 (Supabase에 데이터가 없을 때를 대비)
const DEFAULT_ADMIN = { username: "admin", password: "password" };

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Supabase에서 사용자 조회
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    // DB에서 찾지 못했을 경우 기본 관리자 계정 확인
    if (error || !user) {
      if (
        username === DEFAULT_ADMIN.username &&
        password === DEFAULT_ADMIN.password
      ) {
        // 기본 관리자 계정으로 로그인
      } else {
        return NextResponse.json(
          { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
          { status: 401 }
        );
      }
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
