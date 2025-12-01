'use client';

import { useCalendarStore } from '@/store';
import { X } from 'lucide-react';

export default function DayModal() {
  const { viewingDay, setViewingDay, dayImages, dayMemos } = useCalendarStore();

  if (viewingDay === null) return null;

  const imageUrl = dayImages[viewingDay];
  const memo = dayMemos[viewingDay];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={() => setViewingDay(null)}
          className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Day {viewingDay}</h2>

          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={`Day ${viewingDay}`} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400">
                <p>No image for this day</p>
              </div>
            )}
          </div>

          {memo && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{memo}</p>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
