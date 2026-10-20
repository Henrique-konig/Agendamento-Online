import type { CalendarEvent } from "@/lib/calendar/links";

type AppointmentLike = {
  id: string;
  starts_at: Date | string;
  ends_at: Date | string;
  service_name: string;
  professional: {
    display_name: string;
    show_address: boolean;
    address_line: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  };
};

export function appointmentLocation(p: AppointmentLike["professional"]) {
  if (!p.show_address) return undefined;
  const parts = [p.address_line, p.neighborhood, p.city, p.state].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

export function appointmentToCalendarEvent(a: AppointmentLike, manageUrl: string): CalendarEvent {
  return {
    uid: `${a.id}@agenda-autonomo`,
    title: `${a.service_name} — ${a.professional.display_name}`,
    start: new Date(a.starts_at),
    end: new Date(a.ends_at),
    location: appointmentLocation(a.professional),
    description: `Gerencie seu agendamento: ${manageUrl}`,
  };
}
