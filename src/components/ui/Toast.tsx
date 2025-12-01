"use client";

import { X, Gift } from "lucide-react";

interface ToastProps {
  message: string;
  show: boolean;
  onClose?: () => void;
}

export function Toast({ message, show, onClose }: ToastProps) {
  return (
    <div className="fixed left-0 right-0 top-4 sm:top-6 md:top-8 z-[10000] flex justify-center px-4 pointer-events-none">
      <div
        className={`pointer-events-auto w-full max-w-xl transform transition-all duration-300 ${
          show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/40 px-4 py-3 sm:px-5 sm:py-4 flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-inner">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 text-slate-800 text-sm sm:text-base leading-snug">
            {message}
          </div>
          {onClose && (
            <button
              type="button"
              aria-label="토스트 닫기"
              onClick={onClose}
              className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-500 hover:text-slate-700 hover:bg-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

