"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Loader2, Gift, Trash2 } from "lucide-react";

interface CalendarItem {
  id: string;
  title: string;
  main_image: string | null;
  door_shape: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadCalendars();
  }, []);

  const checkAuthAndLoadCalendars = async () => {
    try {
      // 인증 확인
      const authResponse = await fetch("/api/auth/check");
      if (!authResponse.ok) {
        router.push("/login");
        return;
      }
      const authData = await authResponse.json();
      setUsername(authData.username || "");

      // 캘린더 목록 조회
      const calendarsResponse = await fetch("/api/calendars");
      if (calendarsResponse.ok) {
        const data = await calendarsResponse.json();
        setCalendars(data.calendars || []);
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const handleDeleteCalendar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("정말로 이 캘린더를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/calendars/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCalendars((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-slate-600">로딩 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Advent Calendar
              </h1>
              <p className="text-xs text-slate-500">나만의 어드벤트 캘린더</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-600 text-sm font-medium">
              {username}님
            </span>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">내 캘린더</h2>
            <p className="text-slate-500 mt-1">
              {calendars.length > 0
                ? `총 ${calendars.length}개의 캘린더`
                : "새로운 어드벤트 캘린더를 만들어보세요"}
            </p>
          </div>
          <button
            onClick={() => router.push("/calendars/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/20 font-medium"
          >
            <Plus size={20} />새 캘린더 만들기
          </button>
        </div>

        {/* Calendar Grid */}
        {calendars.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              아직 캘린더가 없습니다
            </h3>
            <p className="text-slate-500 mb-6">
              첫 번째 어드벤트 캘린더를 만들어보세요!
            </p>
            <button
              onClick={() => router.push("/calendars/new")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
            >
              <Plus size={20} />
              캘린더 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calendars.map((calendar) => (
              <div
                key={calendar.id}
                onClick={() => router.push(`/calendars/${calendar.id}/edit`)}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50 relative overflow-hidden">
                  {calendar.main_image ? (
                    <img
                      src={calendar.main_image}
                      alt={calendar.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="grid grid-cols-5 gap-1 p-4 opacity-30">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 ${
                              calendar.door_shape === "circle"
                                ? "rounded-full"
                                : "rounded"
                            } bg-emerald-400`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteCalendar(calendar.id, e)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1 truncate">
                    {calendar.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {formatDate(calendar.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
