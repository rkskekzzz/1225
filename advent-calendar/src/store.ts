import { create } from 'zustand';

interface CalendarState {
  mainImage: string | null;
  dayImages: Record<number, string>;
  dayMemos: Record<number, string>;
  doorShape: 'square' | 'circle';
  openedDays: number[];
  viewingDay: number | null;
  isPreviewMode: boolean;

  setMainImage: (url: string) => void;
  setDayImage: (day: number, url: string) => void;
  setDayMemo: (day: number, memo: string) => void;
  setDoorShape: (shape: 'square' | 'circle') => void;
  toggleDay: (day: number) => void;
  setViewingDay: (day: number | null) => void;
  setPreviewMode: (isPreview: boolean) => void;
  reset: () => void;
  loadConfig: (config: any) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  mainImage: null,
  dayImages: {},
  dayMemos: {},
  doorShape: 'square',
  openedDays: [],
  viewingDay: null,
  isPreviewMode: false,

  setMainImage: (url) => set({ mainImage: url }),
  setDayImage: (day, url) => set((state) => ({
    dayImages: { ...state.dayImages, [day]: url }
  })),
  setDayMemo: (day, memo) => set((state) => ({
    dayMemos: { ...state.dayMemos, [day]: memo }
  })),
  setDoorShape: (shape) => set({ doorShape: shape }),
  toggleDay: (day) => set((state) => {
    const isOpen = state.openedDays.includes(day);
    if (isOpen) {
      return { openedDays: state.openedDays.filter((d) => d !== day) };
    } else {
      return { openedDays: [...state.openedDays, day] };
    }
  }),
  setViewingDay: (day) => set({ viewingDay: day }),
  setPreviewMode: (isPreview) => set({ isPreviewMode: isPreview }),
  reset: () => set({
    mainImage: null,
    dayImages: {},
    dayMemos: {},
    doorShape: 'square',
    openedDays: [],
    viewingDay: null,
    isPreviewMode: false
  }),
  loadConfig: (config) => set({
    mainImage: config.mainImage,
    dayImages: config.dayImages,
    dayMemos: config.dayMemos || {},
    doorShape: config.doorShape,
    viewingDay: config.viewingDay,
  })
}));
