import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

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
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });
    }

    const uploadedUrls: { key: string; url: string }[] = [];

    for (const file of files) {
      const key = (formData.get(`key_${file.name}`) as string) || file.name;

      // Vercel Blob에 업로드
      const blob = await put(
        `advent-calendars/${user.id}/${Date.now()}-${file.name}`,
        file,
        {
          access: "public",
        }
      );

      uploadedUrls.push({
        key,
        url: blob.url,
      });
    }

    return NextResponse.json({
      success: true,
      uploads: uploadedUrls,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "업로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
