"use client";

import { useState } from "react";
import { X, Copy, Check, ExternalLink, Gift } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  shareUrl,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const handleOpen = () => {
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Gift className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">공유 완료! 🎄</h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                어드벤트 캘린더가 저장되었습니다
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-slate-600 text-sm">
            아래 링크를 공유하면 누구나 당신의 어드벤트 캘린더를 볼 수 있습니다.
          </p>

          {/* URL Box */}
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-slate-700 text-sm outline-none truncate font-mono"
            />
            <button
              onClick={handleCopy}
              className={`p-2.5 rounded-lg transition-all ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-white hover:bg-slate-50 text-slate-600 shadow-sm"
              }`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          {copied && (
            <p className="text-emerald-600 text-sm text-center animate-fade-in font-medium">
              ✓ 클립보드에 복사되었습니다!
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleOpen}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all font-medium shadow-lg shadow-emerald-500/20"
            >
              <ExternalLink size={18} />
              미리보기
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
