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
  Hand,
  ZoomIn,
  MousePointer2,
  ChevronDown,
  ChevronUp,
  Settings,
  Image,
  X,
  UploadCloud,
  ExternalLink,
} from "lucide-react";
import Scene from "@/components/3d/Scene";
import DayModal from "@/components/ui/DayModal";
import ShareModal from "@/components/ui/ShareModal";
import { useCalendarStore } from "@/store";
import { convertToWebP } from "@/utils/imageProcessing";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 드래그 가능한 일별 이미지 아이템
function SortableDayItem({
  day,
  imageUrl,
  onImageUpload,
  showMemo,
  memoValue,
  onMemoChange,
  uploadMode,
}: {
  day: number;
  imageUrl: string | undefined;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showMemo: boolean;
  memoValue: string | undefined;
  onMemoChange: (value: string) => void;
  uploadMode: "individual" | "bulk";
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `day-${day}` });

  const [wasDragging, setWasDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 드래그가 끝났을 때 상태 업데이트
  useEffect(() => {
    if (isDragging) {
      setWasDragging(true);
    } else if (wasDragging) {
      // 드래그가 끝난 직후 짧은 지연 후 초기화
      const timer = setTimeout(() => {
        setWasDragging(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDragging, wasDragging]);

  const handleFileInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // 드래그 직후라면 클릭 막기
    if (wasDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="space-y-1.5">
      {/* Day 라벨은 고정 (transform 영향 없음) */}
      <div className="text-xs md:text-sm font-medium text-slate-700 text-center">
        Day {day}
      </div>
      {/* 이미지 영역만 드래그 가능 */}
      <div
        ref={setNodeRef}
        style={style}
        className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg md:rounded-xl flex items-center justify-center overflow-hidden relative group hover:border-emerald-400 transition-colors"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Day ${day}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-slate-400 text-xs">+</span>
        )}

        {/* 드래그 핸들 영역 (이미지 위) */}
        {uploadMode === "bulk" && (
          <div
            className="absolute inset-0 cursor-move z-20"
            {...attributes}
            {...listeners}
          />
        )}

        {/* 파일 입력 (개별 업로드 모드에서만 활성화) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          onClick={handleFileInputClick}
          className={`absolute inset-0 opacity-0 z-10 ${
            uploadMode === "individual"
              ? "cursor-pointer"
              : "cursor-move pointer-events-none"
          }`}
          disabled={uploadMode === "bulk"}
        />
      </div>
      {showMemo && (
        <textarea
          value={memoValue || ""}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="메모..."
          className="w-full px-2 py-1.5 text-xs md:text-sm border border-slate-200 rounded-lg focus:border-emerald-400 focus:outline-none resize-none"
          rows={2}
        />
      )}
    </div>
  );
}

export interface CalendarFormProps {
  mode: "create" | "edit";
  calendarId?: string;
}

export default function CalendarForm({ mode, calendarId }: CalendarFormProps) {
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
    loadConfig,
  } = useCalendarStore();

  const [title, setTitle] = useState(
    mode === "create" ? "나의 어드벤트 캘린더" : ""
  );
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [saveProgress, setSaveProgress] = useState("");

  // 고급 설정 토글 상태
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showDayMemos, setShowDayMemos] = useState(false);

  // 업로드 모드 (개별 또는 일괄)
  const [uploadMode, setUploadMode] = useState<"individual" | "bulk">(
    "individual"
  );

  // Day 라벨은 항상 1-25 고정 (이미지 데이터만 재배치)
  const days = Array.from({ length: 25 }, (_, i) => i + 1);

  // DND 센서 설정 (모바일 터치 지원 개선)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 드래그해야 활성화 (스크롤과 구분)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 원본 파일을 저장할 ref
  const mainImageFileRef = useRef<File | null>(null);
  const backgroundImageFileRef = useRef<File | null>(null);
  const dayImageFilesRef = useRef<Record<number, File>>({});

  // 페이지 진입 시 초기화 또는 로드
  useEffect(() => {
    if (mode === "create") {
      reset();
    } else if (mode === "edit" && calendarId) {
      loadCalendar();
    }
  }, [mode, calendarId]);

  const loadCalendar = async () => {
    if (!calendarId) return;

    try {
      const response = await fetch(`/api/calendars/${calendarId}`);
      if (!response.ok) {
        router.push("/");
        return;
      }

      const data = await response.json();
      const calendar = data.calendar;

      setTitle(calendar.title || "나의 어드벤트 캘린더");
      setUserId(calendar.userId);

      loadConfig({
        mainImage: calendar.mainImage,
        backgroundImage: calendar.backgroundImage || null,
        dayImages: calendar.dayImages || {},
        dayMemos: calendar.dayMemos || {},
        doorShape: calendar.doorShape,
        viewingDay: null,
      });

      // 기존 메모가 있으면 메모 표시 토글 활성화
      if (calendar.dayMemos && Object.keys(calendar.dayMemos).length > 0) {
        setShowDayMemos(true);
      }
      // 기존 배경이미지가 있으면 고급 설정 펼치기
      if (calendar.backgroundImage) {
        setShowAdvancedSettings(true);
      }
    } catch (error) {
      console.error("캘린더 로딩 실패:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

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

  // 일괄 업로드 핸들러
  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 기존에 업로드된 이미지의 마지막 day 찾기
    const existingDays = Object.keys(dayImages)
      .map(Number)
      .sort((a, b) => a - b);
    const lastDay = existingDays.length > 0 ? Math.max(...existingDays) : 0;

    // 새로운 파일을 다음 자리부터 배정
    const fileArray = Array.from(files);
    const remainingSlots = 25 - lastDay; // 남은 자리 계산
    const filesToUpload = fileArray.slice(0, remainingSlots); // 남은 자리만큼만

    if (filesToUpload.length === 0) {
      alert("더 이상 추가할 수 없습니다. (최대 25개)");
      return;
    }

    filesToUpload.forEach((file, index) => {
      const day = lastDay + index + 1; // 마지막 day 다음부터 시작
      dayImageFilesRef.current[day] = file;
      const url = URL.createObjectURL(file);
      setDayImage(day, url);
    });

    // 입력 필드 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = "";
  };

  // DND 핸들러 - 이미지 데이터만 재배치 (Day 라벨은 고정)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // day 번호 추출
      const fromDay = parseInt((active.id as string).replace("day-", ""));
      const toDay = parseInt((over.id as string).replace("day-", ""));

      // 현재 이미지/메모/파일 데이터를 배열로 변환
      const imageEntries = days.map((day) => ({
        image: dayImages[day] || null,
        memo: dayMemos[day] || null,
        file: dayImageFilesRef.current[day] || null,
      }));

      // 배열 재배치 (arrayMove 방식)
      const fromIndex = fromDay - 1;
      const toIndex = toDay - 1;
      const reorderedEntries = arrayMove(imageEntries, fromIndex, toIndex);

      // 재배치된 데이터를 store에 적용
      reorderedEntries.forEach((entry, index) => {
        const day = index + 1;
        if (entry.image) {
          setDayImage(day, entry.image);
        } else {
          setDayImage(day, "");
        }
        if (entry.memo) {
          setDayMemo(day, entry.memo);
        } else {
          setDayMemo(day, "");
        }
        if (entry.file) {
          dayImageFilesRef.current[day] = entry.file;
        } else {
          delete dayImageFilesRef.current[day];
        }
      });
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

  // 단일 이미지 업로드 함수
  const uploadSingleImage = async (
    file: File,
    key: string
  ): Promise<{ key: string; url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("key", key);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "이미지 업로드 실패");
      } else {
        if (response.status === 413) {
          throw new Error("이미지 파일이 너무 큽니다.");
        }
        throw new Error(`이미지 업로드 실패 (${response.status})`);
      }
    }

    const result = await response.json();
    return { key: result.key, url: result.url };
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveProgress("이미지 준비 중...");

    try {
      // 업로드할 이미지 목록 준비
      const uploadTasks: {
        file: File;
        key: string;
        type: "main" | "background" | "day";
        day?: number;
      }[] = [];

      // 메인 이미지 (blob URL인 경우만 업로드 - 새로 추가된 이미지)
      if (mainImage && mainImage.startsWith("blob:")) {
        let mainFile = mainImageFileRef.current;
        if (!mainFile) {
          mainFile = await blobUrlToFile(mainImage, "main-image.jpg");
        }
        if (mainFile) {
          const webpFile = await convertToWebP(mainFile);
          uploadTasks.push({ file: webpFile, key: "main", type: "main" });
        }
      }

      // 배경 이미지 (blob URL인 경우만 업로드)
      if (backgroundImage && backgroundImage.startsWith("blob:")) {
        let bgFile = backgroundImageFileRef.current;
        if (!bgFile) {
          bgFile = await blobUrlToFile(backgroundImage, "background-image.jpg");
        }
        if (bgFile) {
          const webpFile = await convertToWebP(bgFile, 0.9, 400);
          uploadTasks.push({
            file: webpFile,
            key: "background",
            type: "background",
          });
        }
      }

      // 일별 이미지 변환 (blob URL인 경우만 업로드)
      setSaveProgress("이미지 변환 중...");
      for (const [dayStr, url] of Object.entries(dayImages)) {
        const day = parseInt(dayStr);
        if (url.startsWith("blob:")) {
          let dayFile = dayImageFilesRef.current[day];
          if (!dayFile) {
            const convertedFile = await blobUrlToFile(url, `day-${day}.jpg`);
            if (!convertedFile) continue;
            dayFile = convertedFile;
          }
          if (dayFile) {
            const webpFile = await convertToWebP(dayFile, 0.9, 400);
            uploadTasks.push({
              file: webpFile,
              key: `day-${day}`,
              type: "day",
              day,
            });
          }
        }
      }

      let uploadedMainImage = mainImage;
      let uploadedBackgroundImage = backgroundImage;
      const uploadedDayImages: Record<number, string> = { ...dayImages };

      // 이미지 개별 업로드 (진행률 표시)
      if (uploadTasks.length > 0) {
        for (let i = 0; i < uploadTasks.length; i++) {
          const task = uploadTasks[i];
          setSaveProgress(
            `이미지 업로드 중... (${i + 1}/${uploadTasks.length})`
          );

          const result = await uploadSingleImage(task.file, task.key);

          if (task.type === "main") {
            uploadedMainImage = result.url;
          } else if (task.type === "background") {
            uploadedBackgroundImage = result.url;
          } else if (task.type === "day" && task.day !== undefined) {
            uploadedDayImages[task.day] = result.url;
          }
        }
      }

      setSaveProgress("캘린더 저장 중...");

      // 생성/수정에 따라 다른 API 호출
      const apiUrl =
        mode === "create" ? "/api/calendars" : `/api/calendars/${calendarId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const saveResponse = await fetch(apiUrl, {
        method,
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
      const resultUserId = mode === "create" ? saveResult.userId : userId;
      const resultCalendarId =
        mode === "create" ? saveResult.calendarId : calendarId;
      const url = `${baseUrl}/users/${resultUserId}/calendars/${resultCalendarId}`;
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

  const handleViewCalendar = () => {
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/users/${userId}/calendars/${calendarId}`, "_blank");
  };

  const handleShareModalClose = () => {
    setShowShareModal(false);
    if (mode === "create") {
      router.push("/");
    }
  };

  // 로딩 중 (수정 모드에서만)
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-slate-600">캘린더 불러오는 중...</p>
        </div>
      </main>
    );
  }

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
                {mode === "create" ? "새 캘린더 만들기" : "캘린더 수정"}
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {mode === "edit" && (
                <>
                  <button
                    onClick={handleViewCalendar}
                    className="hidden md:flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors font-medium"
                  >
                    <ExternalLink size={18} />
                    공유 링크
                  </button>
                  <button
                    onClick={handleViewCalendar}
                    className="md:hidden p-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    <ExternalLink size={18} />
                  </button>
                </>
              )}
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
                    <span className="hidden sm:inline">
                      {mode === "create" ? "저장 및 공유" : "저장"}
                    </span>
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
            <div className="mb-2 md:mb-4">
              <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-2">
                일별 이미지
              </h2>

              {/* 업로드 모드 선택 */}
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <button
                  onClick={() => setUploadMode("individual")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    uploadMode === "individual"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <Upload size={16} />
                  <span className="font-medium">개별 업로드</span>
                </button>
                <button
                  onClick={() => setUploadMode("bulk")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    uploadMode === "bulk"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <UploadCloud size={16} />
                  <span className="font-medium">일괄 업로드</span>
                </button>
              </div>

              {/* 일괄 업로드 버튼 */}
              {uploadMode === "bulk" && (
                <div className="mb-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                  <label className="flex flex-col items-center gap-2 cursor-pointer">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <UploadCloud size={20} />
                      <span className="font-medium">
                        이미지 일괄 업로드 (최대 25개)
                      </span>
                    </div>
                    <p className="text-xs text-emerald-600 text-center">
                      여러 이미지를 한번에 선택하여 추가할 수 있습니다
                      <br />
                      기존 이미지가 있으면 그 뒤에 추가되며, 드래그앤드롭으로
                      순서를 조정할 수 있습니다
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleBulkUpload}
                      className="hidden"
                    />
                    <div className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                      파일 선택
                    </div>
                  </label>
                </div>
              )}

              {uploadMode === "individual" && (
                <p className="text-slate-500 text-xs md:text-sm mb-3">
                  각 날짜를 클릭하면 표시될 이미지를 설정할 수 있습니다.
                </p>
              )}

              {uploadMode === "bulk" && (
                <p className="text-slate-500 text-xs md:text-sm mb-3">
                  이미지를 드래그하여 날짜 순서를 변경할 수 있습니다.
                </p>
              )}
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={days.map((day) => `day-${day}`)}
                strategy={rectSortingStrategy}
              >
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4"
                  style={{ touchAction: "none" }}
                >
                  {days.map((day) => (
                    <SortableDayItem
                      key={`day-${day}`}
                      day={day}
                      imageUrl={dayImages[day]}
                      onImageUpload={(e) => handleDayImageUpload(day, e)}
                      showMemo={showDayMemos}
                      memoValue={dayMemos[day]}
                      onMemoChange={(value) => setDayMemo(day, value)}
                      uploadMode={uploadMode}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
        onClose={handleShareModalClose}
        shareUrl={shareUrl}
      />
    </>
  );
}
