"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gift, Loader2, Hand, ZoomIn, MousePointer2 } from "lucide-react";
import dynamic from "next/dynamic";
import DayModal from "@/components/ui/DayModal";
import { useCalendarStore } from "@/store";

// SSR 비활성화된 PreviewScene
const PreviewScene = dynamic(() => import("@/components/3d/PreviewScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse">
        <Gift className="w-16 h-16 text-emerald-500/50" />
      </div>
    </div>
  ),
});

const PREVIEW_CALENDAR_ID = "fcb325bf-324d-496b-b759-71a26a236aad";

interface CalendarData {
  mainImage: string | null;
  doorShape: "square" | "circle";
}

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const router = useRouter();
  const { setPreviewMode, loadConfig } = useCalendarStore();

  // 로그인 화면이므로 항상 preview 모드로 설정
  useEffect(() => {
    setPreviewMode(true);
    return () => {
      setPreviewMode(false);
    };
  }, [setPreviewMode]);

  // 프리뷰 캘린더 데이터 로드
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const response = await fetch(`/api/calendars/${PREVIEW_CALENDAR_ID}`);
        if (response.ok) {
          const data = await response.json();
          setCalendarData({
            mainImage: data.calendar.mainImage,
            doorShape: data.calendar.doorShape || "square",
          });

          // Store에 전체 캘린더 데이터 로드 (dayImages, dayMemos 포함)
          loadConfig({
            mainImage: data.calendar.mainImage,
            backgroundImage: data.calendar.backgroundImage || null,
            dayImages: data.calendar.dayImages || {},
            dayMemos: data.calendar.dayMemos || {},
            doorShape: data.calendar.doorShape || "square",
            viewingDay: null,
          });
        }
      } catch (err) {
        console.error("Failed to load preview calendar:", err);
      }
    };

    fetchCalendar();
  }, [loadConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "로그인에 실패했습니다.");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100svh] flex flex-col lg:flex-row relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/image.jpeg')",
          }}
        />
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
      </div>

      {/* Top/Left side - Preview Calendar */}
      <div className="h-[50svh] lg:h-full lg:w-1/2 xl:w-3/5 flex items-center justify-center relative overflow-hidden z-10">
        {/* 3D Calendar Preview */}
        <div className="relative w-full h-full">
          {calendarData && (
            <PreviewScene
              mainImage={calendarData.mainImage}
              doorShape={calendarData.doorShape}
            />
          )}
        </div>

        {/* Image Credit */}
        <div className="absolute bottom-16 lg:bottom-20 right-4 z-20 text-[10px] lg:text-xs text-white/60 bg-black/30 backdrop-blur-sm px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg">
          사진:{" "}
          <a
            href="https://unsplash.com/ko/%EC%82%AC%EC%A7%84/%ED%81%AC%EB%A6%AC%EC%8A%A4%EB%A7%88%EC%8A%A4-%ED%8A%B8%EB%A6%AC%EC%97%90-%EC%8B%B8%EA%B5%AC%EB%A0%A4%EC%9D%98-%EA%B7%BC%EC%A0%91-%EC%B4%AC%EC%98%81-%EC%82%AC%EC%A7%84-SUTfFCAHV_A?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-white underline transition-colors"
          >
            Unsplash
          </a>
          의{" "}
          <a
            href="https://unsplash.com/ko/@chadmadden?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-white underline transition-colors"
          >
            Chad Madden
          </a>
        </div>

        {/* Controls Guide */}
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-lg lg:rounded-xl border border-white/20 px-2 py-1.5 lg:px-3 lg:py-2 shadow-2xl">
            <div className="flex items-center gap-2 lg:gap-3 text-white/90">
              {/* Drag to Rotate */}
              <div className="flex items-center gap-1 lg:gap-1.5">
                <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/20 rounded-md flex items-center justify-center">
                  <Hand size={12} className="lg:w-3.5 lg:h-3.5 text-white" />
                </div>
                <div className="text-[10px] lg:text-xs">
                  <div className="font-medium">드래그</div>
                </div>
              </div>

              <div className="w-px h-4 lg:h-5 bg-white/20"></div>

              {/* Scroll to Zoom */}
              <div className="flex items-center gap-1 lg:gap-1.5">
                <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/20 rounded-md flex items-center justify-center">
                  <ZoomIn size={12} className="lg:w-3.5 lg:h-3.5 text-white" />
                </div>
                <div className="text-[10px] lg:text-xs">
                  <div className="font-medium">휠</div>
                </div>
              </div>

              <div className="w-px h-4 lg:h-5 bg-white/20"></div>

              {/* Click Door */}
              <div className="flex items-center gap-1 lg:gap-1.5">
                <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/20 rounded-md flex items-center justify-center">
                  <MousePointer2
                    size={12}
                    className="lg:w-3.5 lg:h-3.5 text-white"
                  />
                </div>
                <div className="text-[10px] lg:text-xs">
                  <div className="font-medium">클릭</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom/Right side - Login Form */}
      <div className="h-[50svh] lg:h-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 lg:p-8 relative overflow-y-auto z-10">
        <div className="relative bg-white/5 backdrop-blur-xl p-6 lg:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6 lg:mb-8">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3 lg:mb-4">
              <Gift className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">
              Advent Calendar
            </h1>
            <p className="text-slate-300 text-xs lg:text-sm mt-1 text-center">
              나만의 어드벤트 캘린더를 만들어보세요 🎄✨
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs lg:text-sm font-medium text-slate-300 mb-1.5 lg:mb-2"
              >
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="아이디를 입력하세요"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs lg:text-sm font-medium text-slate-300 mb-1.5 lg:mb-2"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="비밀번호를 입력하세요"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-2.5 lg:py-3 px-6 text-sm lg:text-base rounded-xl hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </button>
          </form>

          <div className="mt-4 lg:mt-6 text-center">
            <p className="text-slate-400 text-xs lg:text-sm">
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Day Modal for door opening */}
      <DayModal />
    </div>
  );
}
