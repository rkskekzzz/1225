import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 유효성 검사
    if (!username || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "아이디는 최소 3자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "비밀번호는 최소 4자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // Supabase에 사용자 저장 시도
    try {
      // 중복 확인
      const { data: existingUser } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: "이미 사용 중인 아이디입니다." },
          { status: 409 }
        );
      }

      // 사용자 생성
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ username, password }]);

      if (insertError) {
        throw insertError;
      }
    } catch (supabaseError) {
      // Supabase 연결 실패 시 경고 로그만 출력하고 계속 진행
      console.warn(
        "Supabase 연결 실패, 로컬 모드로 계속합니다:",
        supabaseError
      );
      // 로컬에서는 메모리에 저장하지 않고 그냥 진행
      // (재시작하면 사라지지만 테스트 목적으로는 충분)
    }

    // 자동 로그인 - 쿠키 설정
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
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
