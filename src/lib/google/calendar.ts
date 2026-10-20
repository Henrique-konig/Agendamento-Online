import type { Interval } from "@/lib/scheduling/slots";

const API = "https://www.googleapis.com/calendar/v3";

export class GoogleApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call<T>(accessToken: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new GoogleApiError(body?.error?.message ?? `HTTP ${response.status}`, response.status);
  }
  return body as T;
}

type FreeBusyResponse = {
  calendars: Record<
    string,
    { busy?: Array<{ start: string; end: string }>; errors?: Array<{ reason: string }> }
  >;
};

/** Intervalos ocupados de uma agenda do Google. */
export async function queryFreeBusy(
  accessToken: string,
  calendarId: string,
  from: Date,
  to: Date,
): Promise<Interval[]> {
  const body = await call<FreeBusyResponse>(accessToken, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      items: [{ id: calendarId }],
    }),
  });
  const calendar = body.calendars[calendarId];
  if (calendar?.errors?.length) {
    throw new GoogleApiError(`freeBusy: ${calendar.errors[0].reason}`, 400);
  }
  return (calendar?.busy ?? []).map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

export type CalendarEventInput = {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  /** Identificador estável para evitar eventos duplicados em reenvios. */
  privateId: string;
};

export async function insertEvent(
  accessToken: string,
  calendarId: string,
  event: CalendarEventInput,
) {
  const body = await call<{ id: string }>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: { dateTime: event.start.toISOString() },
        end: { dateTime: event.end.toISOString() },
        extendedProperties: { private: { agendaAutonomoId: event.privateId } },
        reminders: { useDefault: true },
      }),
    },
  );
  return body.id;
}

export async function deleteEvent(accessToken: string, calendarId: string, eventId: string) {
  try {
    await call(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE" },
    );
  } catch (e) {
    // Já removido manualmente no Google: nada a fazer.
    if (e instanceof GoogleApiError && (e.status === 404 || e.status === 410)) return;
    throw e;
  }
}
