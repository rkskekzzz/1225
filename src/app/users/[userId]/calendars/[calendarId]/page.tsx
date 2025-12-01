"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Scene from "@/components/3d/Scene";
import DayModal from "@/components/ui/DayModal";
import { useCalendarStore } from "@/store";
import { Gift, Loader2, Home, MousePointer2, Hand, ZoomIn } from "lucide-react";

interface CalendarData {
  id: string;
  userId: string;
  title: string;
  mainImage: string | null;
  dayImages: Record<number, string>;
  dayMemos: Record<number, string>;
  doorShape: "square" | "circle";
  createdAt: string;
  username: string;
}

export default function SharedCalendarViewer() {
  const params = useParams();
  const { loadConfig, setPreviewMode } = useCalendarStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const response = await fetch(`/api/calendars/${params.calendarId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("캘린더를 찾을 수 없습니다");
          } else {
            setError("캘린더를 불러오는데 실패했습니다");
          }
          return;
        }

        const data = await response.json();
        setCalendarData(data.calendar);

        loadConfig({
          mainImage: data.calendar.mainImage,
          dayImages: data.calendar.dayImages || {},
          dayMemos: data.calendar.dayMemos || {},
          doorShape: data.calendar.doorShape,
          viewingDay: null,
        });

        setPreviewMode(false); // 공유 링크는 실제 캘린더이므로 날짜 제한 적용
      } catch (err) {
        console.error("캘린더 로딩 오류:", err);
        setError("캘린더를 불러오는데 실패했습니다");
      } finally {
        setLoading(false);
      }
    };

    if (params.calendarId) {
      fetchCalendar();
    }
  }, [params.calendarId, loadConfig, setPreviewMode]);

  if (loading) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
          <p className="text-white/80 text-lg">
            어드벤트 캘린더를 불러오는 중...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <Gift className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">앗!</h1>
          <p className="text-white/70">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-medium"
          >
            <Home size={18} />
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold">
                  {calendarData?.title || "어드벤트 캘린더"}
                </h1>
                <p className="text-white/50 text-sm">
                  by {calendarData?.username} 🎄
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Scene */}
        <div className="absolute inset-0 z-0">
          <Scene />
        </div>

        {/* Day Modal */}
        <DayModal />

        {/* Snowfall Effect */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-snowfall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </main>

      {/* Controls Guide - Outside main to avoid overflow-hidden */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999]">
        <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/20 px-3 py-2 md:px-6 md:py-4 shadow-2xl">
          <div className="flex items-center gap-3 md:gap-6 text-white/90">
            {/* Drag to Rotate */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Hand size={14} className="md:w-4 md:h-4 text-white" />
              </div>
              <div className="text-xs md:text-sm">
                <div className="font-medium">드래그</div>
                <div className="text-white/60 text-[10px] md:text-xs hidden md:block">
                  회전
                </div>
              </div>
            </div>

            <div className="w-px h-6 md:h-8 bg-white/20"></div>

            {/* Scroll to Zoom */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <ZoomIn size={14} className="md:w-4 md:h-4 text-white" />
              </div>
              <div className="text-xs md:text-sm">
                <div className="font-medium">휠</div>
                <div className="text-white/60 text-[10px] md:text-xs hidden md:block">
                  확대/축소
                </div>
              </div>
            </div>

            <div className="w-px h-6 md:h-8 bg-white/20"></div>

            {/* Click Door */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <MousePointer2 size={14} className="md:w-4 md:h-4 text-white" />
              </div>
              <div className="text-xs md:text-sm">
                <div className="font-medium">클릭</div>
                <div className="text-white/60 text-[10px] md:text-xs hidden md:block">
                  문 열기
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
