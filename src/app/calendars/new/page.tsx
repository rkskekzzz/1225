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
  Hand,
  ZoomIn,
  MousePointer2,
  ChevronDown,
  ChevronUp,
  Settings,
  Image,
  X,
} from "lucide-react";
import Scene from "@/components/3d/Scene";
import DayModal from "@/components/ui/DayModal";
import ShareModal from "@/components/ui/ShareModal";
import { useCalendarStore } from "@/store";
import { convertToWebP } from "@/utils/imageProcessing";

export default function NewCalendarPage() {
  const router = useRouter();
  const {
    setMainImage,
    setBackgroundImage,
    setDayImage,
    setDayMemo,
    setDoorShape,
    doorShape,
    setPreviewMode,
    isPreviewMode,
    mainImage,
    backgroundImage,
    dayImages,
    dayMemos,
    reset,
  } = useCalendarStore();

  const [title, setTitle] = useState("나의 어드벤트 캘린더");
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [saveProgress, setSaveProgress] = useState("");

  // 고급 설정 토글 상태
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showDayMemos, setShowDayMemos] = useState(false);

  // 원본 파일을 저장할 ref
  const mainImageFileRef = useRef<File | null>(null);
  const backgroundImageFileRef = useRef<File | null>(null);
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

  const handleBackgroundImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      backgroundImageFileRef.current = file;
      const url = URL.createObjectURL(file);
      setBackgroundImage(url);
    }
  };

  const handleRemoveBackgroundImage = () => {
    backgroundImageFileRef.current = null;
    setBackgroundImage(null);
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
    setSaveProgress("이미지 변환 중...");

    try {
      const formData = new FormData();
      const imageKeys: {
        key: string;
        type: "main" | "background" | "day";
        day?: number;
      }[] = [];

      // 메인 이미지
      if (mainImage) {
        let mainFile = mainImageFileRef.current;
        if (!mainFile && mainImage.startsWith("blob:")) {
          mainFile = await blobUrlToFile(mainImage, "main-image.jpg");
        }
        if (mainFile) {
          // WebP로 변환
          const webpFile = await convertToWebP(mainFile);
          formData.append("files", webpFile);
          formData.append(`key_${webpFile.name}`, "main");
          imageKeys.push({ key: "main", type: "main" });
        }
      }

      // 배경 이미지
      if (backgroundImage) {
        let bgFile = backgroundImageFileRef.current;
        if (!bgFile && backgroundImage.startsWith("blob:")) {
          bgFile = await blobUrlToFile(backgroundImage, "background-image.jpg");
        }
        if (bgFile) {
          const webpFile = await convertToWebP(bgFile);
          formData.append("files", webpFile);
          formData.append(`key_${webpFile.name}`, "background");
          imageKeys.push({ key: "background", type: "background" });
        }
      }

      // 일별 이미지
      setSaveProgress("일별 이미지 변환 중...");
      for (const [dayStr, url] of Object.entries(dayImages)) {
        const day = parseInt(dayStr);
        let dayFile = dayImageFilesRef.current[day];
        if (!dayFile && url.startsWith("blob:")) {
          const convertedFile = await blobUrlToFile(url, `day-${day}.jpg`);
          if (!convertedFile) continue;
          dayFile = convertedFile;
        }
        if (dayFile) {
          // WebP로 변환
          const webpFile = await convertToWebP(dayFile);
          formData.append("files", webpFile);
          formData.append(`key_${webpFile.name}`, `day-${day}`);
          imageKeys.push({ key: `day-${day}`, type: "day", day });
        }
      }

      let uploadedMainImage = mainImage;
      let uploadedBackgroundImage = backgroundImage;
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
          } else if (upload.key === "background") {
            uploadedBackgroundImage = upload.url;
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
          backgroundImage: uploadedBackgroundImage,
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
      <>
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
                  <MousePointer2
                    size={14}
                    className="md:w-4 md:h-4 text-white"
                  />
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

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-3 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <h1 className="text-sm md:text-lg font-bold text-slate-900 truncate">
                새 캘린더 만들기
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={() => setPreviewMode(true)}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                <Eye className="w-[18px] h-[18px]" />
                <span className="hidden sm:inline">미리보기</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/20 font-medium disabled:opacity-50 min-w-[80px] md:min-w-[120px] justify-center text-sm md:text-base"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                    <span className="text-xs md:text-sm hidden sm:inline">
                      {saveProgress || "저장 중..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Save className="w-[18px] h-[18px]" />
                    <span className="hidden sm:inline">저장 및 공유</span>
                    <span className="sm:hidden">저장</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-8 space-y-3 md:space-y-8">
          {/* Title Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-3 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-2 md:mb-4">
              캘린더 제목
            </h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="캘린더 제목을 입력하세요"
              className="w-full px-3 md:px-4 py-2.5 md:py-3 text-base border border-slate-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all text-slate-900"
            />
          </section>

          {/* Main Image Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-3 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-2 md:mb-4">
              메인 이미지
            </h2>
            <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-6">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden relative hover:border-emerald-400 transition-colors group flex-shrink-0">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt="Main"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="w-6 h-6 md:w-8 md:h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs md:text-sm text-slate-500">
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
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                  박스 전면에 표시될 이미지입니다.
                  <br />
                  25개의 문에 자동으로 분할되어 표시됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* Door Shape Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-3 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-2 md:mb-4">
              문 모양
            </h2>
            <div className="flex gap-2 md:gap-4">
              <button
                onClick={() => setDoorShape("square")}
                className={`flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2.5 md:py-3 rounded-xl border-2 transition-all text-sm md:text-base ${
                  doorShape === "square"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <Square size={18} className="md:w-5 md:h-5" />
                <span className="font-medium">사각형</span>
              </button>
              <button
                onClick={() => setDoorShape("circle")}
                className={`flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2.5 md:py-3 rounded-xl border-2 transition-all text-sm md:text-base ${
                  doorShape === "circle"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <Circle size={18} className="md:w-5 md:h-5" />
                <span className="font-medium">원형</span>
              </button>
            </div>
          </section>

          {/* Daily Images Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-3 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-2 md:mb-4">
              일별 이미지
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mb-3 md:mb-6">
              각 날짜를 클릭하면 표시될 이미지를 설정할 수 있습니다.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
              {Array.from({ length: 25 }, (_, i) => i + 1).map((day) => (
                <div key={day} className="space-y-1.5">
                  <div className="text-xs md:text-sm font-medium text-slate-700 text-center">
                    Day {day}
                  </div>
                  <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg md:rounded-xl flex items-center justify-center overflow-hidden relative group hover:border-emerald-400 transition-colors">
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
                  {showDayMemos && (
                    <textarea
                      value={dayMemos[day] || ""}
                      onChange={(e) => setDayMemo(day, e.target.value)}
                      placeholder="메모..."
                      className="w-full px-2 py-1.5 text-xs md:text-sm border border-slate-200 rounded-lg focus:border-emerald-400 focus:outline-none resize-none"
                      rows={2}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Advanced Settings Section */}
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="w-full p-3 md:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-slate-500" />
                <h2 className="text-base md:text-lg font-semibold text-slate-900">
                  고급 설정
                </h2>
              </div>
              {showAdvancedSettings ? (
                <ChevronUp size={20} className="text-slate-400" />
              ) : (
                <ChevronDown size={20} className="text-slate-400" />
              )}
            </button>

            {showAdvancedSettings && (
              <div className="px-3 pb-3 md:px-6 md:pb-6 space-y-6 border-t border-slate-100">
                {/* Day Memos Toggle */}
                <div className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm md:text-base font-medium text-slate-700">
                        날짜별 메모 작성
                      </h3>
                      <p className="text-slate-500 text-xs md:text-sm mt-1">
                        각 날짜에 메모를 추가할 수 있습니다.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDayMemos(!showDayMemos)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showDayMemos ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showDayMemos ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Background Image */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm md:text-base font-medium text-slate-700 mb-2">
                    배경 이미지
                  </h3>
                  <p className="text-slate-500 text-xs md:text-sm mb-3">
                    3D 뷰어 배경에 표시될 이미지입니다. 설정하지 않으면 기본
                    배경이 사용됩니다.
                  </p>
                  <div className="flex items-start gap-3">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden relative hover:border-emerald-400 transition-colors group flex-shrink-0">
                      {backgroundImage ? (
                        <>
                          <img
                            src={backgroundImage}
                            alt="Background"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={handleRemoveBackgroundImage}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <div className="text-center">
                          <Image className="w-5 h-5 md:w-6 md:h-6 text-slate-400 mx-auto mb-1" />
                          <span className="text-xs text-slate-500">배경</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
