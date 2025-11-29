'use client';

import Scene from '@/components/3d/Scene';
import CreationForm from '@/components/ui/CreationForm';
import DayModal from '@/components/ui/DayModal';

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>

      {/* UI Layer */}
      <CreationForm />

      {/* Modal Layer */}
      <DayModal />
    </main>
  );
}
