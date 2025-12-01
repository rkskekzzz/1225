import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// 단일 파일 업로드 API
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const key = formData.get("key") as string;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
    }

    // Vercel Blob에 업로드
    const blob = await put(
      `advent-calendars/${user.id}/${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
        token: process.env.PLAYGROUND_1225_READ_WRITE_TOKEN,
      }
    );

    return NextResponse.json({
      success: true,
      key: key || file.name,
      url: blob.url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "업로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
