import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// 특정 캘린더 조회 (공개)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const { calendarId } = await params;

    const { data, error } = await supabase
      .from("advent_calendars")
      .select(
        `
        id,
        user_id,
        title,
        main_image,
        background_image,
        day_images,
        day_memos,
        door_shape,
        created_at,
        users!advent_calendars_user_id_fkey(username)
      `
      )
      .eq("id", calendarId)
      .single();

    if (error || !data) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "캘린더를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      calendar: {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        mainImage: data.main_image,
        backgroundImage: data.background_image,
        dayImages: data.day_images,
        dayMemos: data.day_memos,
        doorShape: data.door_shape,
        createdAt: data.created_at,
        username: (data.users as any)?.username,
      },
    });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 캘린더 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { calendarId } = await params;
    const body = await request.json();
    const { title, mainImage, backgroundImage, dayImages, dayMemos, doorShape } = body;

    // 권한 확인
    const { data: existing } = await supabase
      .from("advent_calendars")
      .select("user_id")
      .eq("id", calendarId)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("advent_calendars")
      .update({
        title,
        main_image: mainImage,
        background_image: backgroundImage || null,
        day_images: dayImages,
        day_memos: dayMemos,
        door_shape: doorShape,
      })
      .eq("id", calendarId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "수정 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar update error:", error);
    return NextResponse.json(
      { error: "수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 캘린더 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ calendarId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { calendarId } = await params;

    // 권한 확인
    const { data: existing } = await supabase
      .from("advent_calendars")
      .select("user_id")
      .eq("id", calendarId)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("advent_calendars")
      .delete()
      .eq("id", calendarId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar delete error:", error);
    return NextResponse.json(
      { error: "삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
