"use client";

import { useParams } from "next/navigation";
import CalendarForm from "@/components/ui/CalendarForm";

export default function EditCalendarPage() {
  const params = useParams();
  const calendarId = params.id as string;

  return <CalendarForm mode="edit" calendarId={calendarId} />;
}
