import type { TourEvent } from "@/lib/types";

// The tour only runs events in the UAE, which is UTC+4 year-round (no DST).
const DUBAI_UTC_OFFSET_HOURS = 4;
const DEFAULT_DURATION_HOURS = 5;

function parseTime(value: string | null | undefined): { hours: number; minutes: number } | null {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function toUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function toUtcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

export function getEventCalendarWindow(event: TourEvent): { start: Date; end: Date; allDay: boolean } {
  const time = parseTime(event.first_tee_time) ?? parseTime(event.shotgun_time) ?? parseTime(event.arrival_time);
  const [year, month, day] = event.event_date.split("-").map(Number);

  if (!time) {
    const start = new Date(Date.UTC(year, month - 1, day));
    const end = new Date(Date.UTC(year, month - 1, day + 1));
    return { start, end, allDay: true };
  }

  const start = new Date(Date.UTC(year, month - 1, day, time.hours - DUBAI_UTC_OFFSET_HOURS, time.minutes));
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
  return { start, end, allDay: false };
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcsContent(event: TourEvent, siteUrl: string): string {
  const { start, end, allDay } = getEventCalendarWindow(event);
  const dtStart = allDay ? `DTSTART;VALUE=DATE:${toUtcDateOnly(start)}` : `DTSTART:${toUtcStamp(start)}`;
  const dtEnd = allDay ? `DTEND;VALUE=DATE:${toUtcDateOnly(end)}` : `DTEND:${toUtcStamp(end)}`;
  const eventUrl = `${siteUrl}/events/${event.slug}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TP Tour//Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@tptour`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    dtStart,
    dtEnd,
    `SUMMARY:${escapeIcsText(`TP Tour — ${event.name}`)}`,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : null,
    `DESCRIPTION:${escapeIcsText(`TP Tour event. Details: ${eventUrl}`)}`,
    `URL:${eventUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return lines.join("\r\n");
}

export function buildGoogleCalendarUrl(event: TourEvent, siteUrl: string): string {
  const { start, end, allDay } = getEventCalendarWindow(event);
  const dates = allDay
    ? `${toUtcDateOnly(start)}/${toUtcDateOnly(end)}`
    : `${toUtcStamp(start)}/${toUtcStamp(end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `TP Tour — ${event.name}`,
    dates,
    details: `TP Tour event. Details: ${siteUrl}/events/${event.slug}`,
    location: event.location ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
