'use client';

import { useState } from 'react';
import { useCalendarStore } from '@/store';
import { Upload, Save, Eye, Square, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CreationForm() {
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
    dayMemos
  } = useCalendarStore();

  const [isSaving, setIsSaving] = useState(false);

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMainImage(url);
    }
  };

  const handleDayImageUpload = (day: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setDayImage(day, url);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement actual Supabase upload and save logic
    // For now, we just simulate a save
    setTimeout(() => {
      setIsSaving(false);
      alert('Calendar saved! (Simulation)');
    }, 1000);
  };

  if (isPreviewMode) {
    return (
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setPreviewMode(false)}
          className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg hover:bg-white transition-colors"
        >
          Back to Edit
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-white/95 backdrop-blur overflow-y-auto p-8 z-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Advent Calendar</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setPreviewMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Eye size={20} /> Preview
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save size={20} /> {isSaving ? 'Saving...' : 'Share'}
            </button>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Main Box Image</h2>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative">
              {mainImage ? (
                <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
              ) : (
                <Upload className="text-gray-400" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-sm text-gray-500">
              Upload an image that will cover the front of the box. <br/>
              It will be automatically split across the 25 doors.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Door Shape</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setDoorShape('square')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${doorShape === 'square' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}
            >
              <Square size={20} /> Square
            </button>
            <button
              onClick={() => setDoorShape('circle')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${doorShape === 'circle' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}
            >
              <Circle size={20} /> Circle
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Daily Images</h2>
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 25 }, (_, i) => i + 1).map((day) => (
              <div key={day} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Day {day}</label>
                <div className="aspect-square bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative group hover:border-blue-400 transition-colors">
                  {dayImages[day] ? (
                    <img src={dayImages[day]} alt={`Day ${day}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs">Upload</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleDayImageUpload(day, e)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <textarea
                  value={dayMemos[day] || ''}
                  onChange={(e) => setDayMemo(day, e.target.value)}
                  placeholder="Add a memo..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:border-blue-400 focus:outline-none resize-none"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
