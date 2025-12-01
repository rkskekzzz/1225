import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import SharedCalendarViewer from "./SharedCalendarViewer";

interface PageProps {
  params: Promise<{
    userId: string;
    calendarId: string;
  }>;
}

// 동적 OG 메타데이터 생성
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { calendarId } = await params;

  try {
    const { data } = await supabase
      .from("advent_calendars")
      .select(
        `
        title,
        main_image,
        users!advent_calendars_user_id_fkey(username)
      `
      )
      .eq("id", calendarId)
      .single();

    if (!data) {
      return {
        title: "어드벤트 캘린더",
        description: "나만의 크리스마스 어드벤트 캘린더를 만들어 공유해요 🎄✨",
      };
    }

    const title = data.title || "어드벤트 캘린더";
    const username = (data.users as any)?.username || "익명";
    const ogImage = data.main_image || "/image.jpeg";

    return {
      title: `${title} - by ${username} 🎄`,
      description: "나만의 크리스마스 어드벤트 캘린더를 만들어 공유해요 🎄✨",
      openGraph: {
        title: `${title} 🎁`,
        description: "나만의 크리스마스 어드벤트 캘린더를 만들어 공유해요 🎄✨",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} 🎁`,
        description: "나만의 크리스마스 어드벤트 캘린더를 만들어 공유해요 🎄✨",
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error("메타데이터 생성 오류:", error);
    return {
      title: "어드벤트 캘린더",
      description: "나만의 크리스마스 어드벤트 캘린더를 만들어 공유해요 🎄✨",
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { userId, calendarId } = await params;

  return <SharedCalendarViewer userId={userId} calendarId={calendarId} />;
}
