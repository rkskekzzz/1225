import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// 캘린더 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, mainImage, dayImages, dayMemos, doorShape } = body;

    // 캘린더 데이터 저장
    const { data, error } = await supabase
      .from("advent_calendars")
      .insert({
        user_id: user.id,
        title: title || "나의 어드벤트 캘린더",
        main_image: mainImage,
        day_images: dayImages,
        day_memos: dayMemos,
        door_shape: doorShape,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "저장 실패" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      calendarId: data.id,
      userId: user.id,
    });
  } catch (error) {
    console.error("Calendar save error:", error);
    return NextResponse.json(
      { error: "저장 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 사용자의 캘린더 목록 조회
export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("advent_calendars")
      .select("id, title, main_image, door_shape, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }

    return NextResponse.json({ calendars: data || [] });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
