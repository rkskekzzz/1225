"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Save,
  Eye,
  Square,
  Circle,
  Loader2,
  Gift,
} from "lucide-react";
import Scene from "@/components/3d/Scene";
import DayModal from "@/components/ui/DayModal";
import ShareModal from "@/components/ui/ShareModal";
import { useCalendarStore } from "@/store";

export default function NewCalendarPage() {
  const router = useRouter();
  const {
    setMainImage,
    setDayImage,
    setDayMemo,
    setDoorShape,
    doorShape,
    setPreviewMode,
    isPreviewMode,
    mainImage,
    dayImages,
    dayMemos,
    reset,
  } = useCalendarStore();

  const [title, setTitle] = useState("나의 어드벤트 캘린더");
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [saveProgress, setSaveProgress] = useState("");

  // 원본 파일을 저장할 ref
  const mainImageFileRef = useRef<File | null>(null);
  const dayImageFilesRef = useRef<Record<number, File>>({});

  // 페이지 진입 시 store 초기화
  useEffect(() => {
    reset();
  }, [reset]);

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      mainImageFileRef.current = file;
      const url = URL.createObjectURL(file);
      setMainImage(url);
    }
  };

  const handleDayImageUpload = (
    day: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      dayImageFilesRef.current[day] = file;
      const url = URL.createObjectURL(file);
      setDayImage(day, url);
    }
  };

  const blobUrlToFile = async (
    blobUrl: string,
    filename: string
  ): Promise<File | null> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error("Blob URL 변환 실패:", error);
      return null;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveProgress("이미지 업로드 준비 중...");

    try {
      const formData = new FormData();
      const imageKeys: { key: string; type: "main" | "day"; day?: number }[] =
        [];

      // 메인 이미지
      if (mainImage) {
        let mainFile = mainImageFileRef.current;
        if (!mainFile && mainImage.startsWith("blob:")) {
          mainFile = await blobUrlToFile(mainImage, "main-image.jpg");
        }
        if (mainFile) {
          formData.append("files", mainFile);
          formData.append(`key_${mainFile.name}`, "main");
          imageKeys.push({ key: "main", type: "main" });
        }
      }

      // 일별 이미지
      for (const [dayStr, url] of Object.entries(dayImages)) {
        const day = parseInt(dayStr);
        let dayFile = dayImageFilesRef.current[day];
        if (!dayFile && url.startsWith("blob:")) {
          dayFile = (await blobUrlToFile(url, `day-${day}.jpg`)) || undefined;
        }
        if (dayFile) {
          formData.append("files", dayFile);
          formData.append(`key_${dayFile.name}`, `day-${day}`);
          imageKeys.push({ key: `day-${day}`, type: "day", day });
        }
      }

      let uploadedMainImage = mainImage;
      const uploadedDayImages: Record<number, string> = { ...dayImages };

      if (imageKeys.length > 0) {
        setSaveProgress("이미지 업로드 중...");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "이미지 업로드 실패");
        }

        const uploadResult = await uploadResponse.json();

        for (const upload of uploadResult.uploads) {
          if (upload.key === "main") {
            uploadedMainImage = upload.url;
          } else if (upload.key.startsWith("day-")) {
            const day = parseInt(upload.key.replace("day-", ""));
            uploadedDayImages[day] = upload.url;
          }
        }
      }

      setSaveProgress("캘린더 저장 중...");

      const saveResponse = await fetch("/api/calendars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          mainImage: uploadedMainImage,
          dayImages: uploadedDayImages,
          dayMemos,
          doorShape,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "캘린더 저장 실패");
      }

      const saveResult = await saveResponse.json();

      const baseUrl = window.location.origin;
      const url = `${baseUrl}/users/${saveResult.userId}/calendars/${saveResult.calendarId}`;
      setShareUrl(url);
      setShowShareModal(true);
      setSaveProgress("");
    } catch (error) {
      console.error("저장 실패:", error);
      alert(
        error instanceof Error ? error.message : "저장 중 오류가 발생했습니다"
      );
    } finally {
      setIsSaving(false);
      setSaveProgress("");
    }
  };

  // 프리뷰 모드
  if (isPreviewMode) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => setPreviewMode(false)}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur rounded-xl shadow-lg hover:bg-white transition-colors text-slate-700 font-medium"
          >
            <ArrowLeft size={18} />
            편집으로 돌아가기
          </button>
        </div>
        <div className="absolute inset-0 z-0">
          <Scene />
        </div>
        <DayModal />
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    새 캘린더 만들기
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                <Eye size={18} />
                미리보기
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/20 font-medium disabled:opacity-50 min-w-[120px] justify-center"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">
                      {saveProgress || "저장 중..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    저장 및 공유
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Title Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              캘린더 제목
            </h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="캘린더 제목을 입력하세요"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all text-slate-900"
            />
          </section>

          {/* Main Image Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              메인 이미지
            </h2>
            <div className="flex items-start gap-6">
              <div className="w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden relative hover:border-emerald-400 transition-colors group">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt="Main"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-sm text-slate-500">
                      이미지 업로드
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <p className="text-slate-600 text-sm leading-relaxed">
                  박스 전면에 표시될 이미지입니다.
                  <br />
                  25개의 문에 자동으로 분할되어 표시됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* Door Shape Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              문 모양
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setDoorShape("square")}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
                  doorShape === "square"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <Square size={20} />
                <span className="font-medium">사각형</span>
              </button>
              <button
                onClick={() => setDoorShape("circle")}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
                  doorShape === "circle"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <Circle size={20} />
                <span className="font-medium">원형</span>
              </button>
            </div>
          </section>

          {/* Daily Images Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              일별 이미지 & 메모
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              각 날짜를 클릭하면 표시될 이미지와 메모를 설정할 수 있습니다.
            </p>
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 25 }, (_, i) => i + 1).map((day) => (
                <div key={day} className="space-y-2">
                  <div className="text-sm font-medium text-slate-700 text-center">
                    Day {day}
                  </div>
                  <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden relative group hover:border-emerald-400 transition-colors">
                    {dayImages[day] ? (
                      <img
                        src={dayImages[day]}
                        alt={`Day ${day}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-400 text-xs">+</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDayImageUpload(day, e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <textarea
                    value={dayMemos[day] || ""}
                    onChange={(e) => setDayMemo(day, e.target.value)}
                    placeholder="메모..."
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-emerald-400 focus:outline-none resize-none"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          router.push("/");
        }}
        shareUrl={shareUrl}
      />
    </>
  );
}
