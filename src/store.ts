import { create } from "zustand";

interface CalendarState {
  mainImage: string | null;
  backgroundImage: string | null;
  dayImages: Record<number, string>;
  dayMemos: Record<number, string>;
  doorShape: "square" | "circle";
  openedDays: number[];
  viewingDay: number | null;
  isPreviewMode: boolean;

  setMainImage: (url: string) => void;
  setBackgroundImage: (url: string | null) => void;
  setDayImage: (day: number, url: string) => void;
  setDayMemo: (day: number, memo: string) => void;
  setDoorShape: (shape: "square" | "circle") => void;
  toggleDay: (day: number) => void;
  setViewingDay: (day: number | null) => void;
  setPreviewMode: (isPreview: boolean) => void;
  reset: () => void;
  loadConfig: (config: any) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  mainImage: null,
  backgroundImage: null,
  dayImages: {},
  dayMemos: {},
  doorShape: "square",
  openedDays: [],
  viewingDay: null,
  isPreviewMode: false,

  setMainImage: (url) => set({ mainImage: url }),
  setBackgroundImage: (url) => set({ backgroundImage: url }),
  setDayImage: (day, url) =>
    set((state) => {
      if (!url) {
        // 빈 문자열이면 해당 키 삭제
        const { [day]: _, ...remainingImages } = state.dayImages;
        return { dayImages: remainingImages };
      }
      return { dayImages: { ...state.dayImages, [day]: url } };
    }),
  setDayMemo: (day, memo) =>
    set((state) => {
      if (!memo) {
        // 빈 문자열이면 해당 키 삭제
        const { [day]: _, ...remainingMemos } = state.dayMemos;
        return { dayMemos: remainingMemos };
      }
      return { dayMemos: { ...state.dayMemos, [day]: memo } };
    }),
  setDoorShape: (shape) => set({ doorShape: shape }),
  toggleDay: (day) =>
    set((state) => {
      const isOpen = state.openedDays.includes(day);
      if (isOpen) {
        return { openedDays: state.openedDays.filter((d) => d !== day) };
      } else {
        return { openedDays: [...state.openedDays, day] };
      }
    }),
  setViewingDay: (day) => set({ viewingDay: day }),
  setPreviewMode: (isPreview) => set({ isPreviewMode: isPreview }),
  reset: () =>
    set({
      mainImage: null,
      backgroundImage: null,
      dayImages: {},
      dayMemos: {},
      doorShape: "square",
      openedDays: [],
      viewingDay: null,
      isPreviewMode: false,
    }),
  loadConfig: (config) =>
    set({
      mainImage: config.mainImage,
      backgroundImage: config.backgroundImage || null,
      dayImages: config.dayImages,
      dayMemos: config.dayMemos || {},
      doorShape: config.doorShape,
      viewingDay: config.viewingDay,
    }),
}));
