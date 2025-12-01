'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Scene from '@/components/3d/Scene';
import DayModal from '@/components/ui/DayModal';
import { useCalendarStore } from '@/store';
import { supabase } from '@/lib/supabase';

export default function SharedCalendar() {
  const params = useParams();
  const { loadConfig } = useCalendarStore();

  useEffect(() => {
    // TODO: Fetch from Supabase
    // const { data } = await supabase.from('calendars').select('*').eq('id', params.id).single();
    // if (data) loadConfig(data.config);

    console.log('Loading calendar:', params.id);
  }, [params.id, loadConfig]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-900">
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>
      <DayModal />
    </main>
  );
}
