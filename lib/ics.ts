import type { TourEvent } from "@/lib/types";

export type IcsEvent = Pick<
  TourEvent,
  "id" | "slug" | "name" | "event_date" | "location" | "arrival_time" | "first_tee_time" | "shotgun_time"
>;

// The tour only runs events in the UAE, which is UTC+4 year-round (no DST).
const DUBAI_UTC_OFFSET_HOURS = 4;
// Per the club: the diary entry starts at arrival time and ends 4 hours after
// first tee time (not 4 hours after arrival, and not a fixed slot from arrival).
const POST_TEE_TIME_DURATION_HOURS = 4;

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

export function getEventCalendarWindow(event: IcsEvent): { start: Date; end: Date; allDay: boolean } {
  const [year, month, day] = event.event_date.split("-").map(Number);

  const arrivalTime = parseTime(event.arrival_time);
  const teeTime = parseTime(event.first_tee_time) ?? parseTime(event.shotgun_time);
  const startTime = arrivalTime ?? teeTime;

  if (!startTime) {
    const start = new Date(Date.UTC(year, month - 1, day));
    const end = new Date(Date.UTC(year, month - 1, day + 1));
    return { start, end, allDay: true };
  }

  const start = new Date(Date.UTC(year, month - 1, day, startTime.hours - DUBAI_UTC_OFFSET_HOURS, startTime.minutes));

  const endBaseTime = teeTime ?? startTime;
  const endBase = new Date(Date.UTC(year, month - 1, day, endBaseTime.hours - DUBAI_UTC_OFFSET_HOURS, endBaseTime.minutes));
  const end = new Date(endBase.getTime() + POST_TEE_TIME_DURATION_HOURS * 60 * 60 * 1000);

  return { start, end, allDay: false };
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildVeventLines(event: IcsEvent, siteUrl: string): string[] {
  const { start, end, allDay } = getEventCalendarWindow(event);
  const dtStart = allDay ? `DTSTART;VALUE=DATE:${toUtcDateOnly(start)}` : `DTSTART:${toUtcStamp(start)}`;
  const dtEnd = allDay ? `DTEND;VALUE=DATE:${toUtcDateOnly(end)}` : `DTEND:${toUtcStamp(end)}`;
  const eventUrl = `${siteUrl}/events/${event.slug}`;

  return [
    `UID:${event.id}@tptour`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    dtStart,
    dtEnd,
    `SUMMARY:${escapeIcsText(`TP Tour — ${event.name}`)}`,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : null,
    `DESCRIPTION:${escapeIcsText(`TP Tour event. Details: ${eventUrl}`)}`,
    `URL:${eventUrl}`,
  ].filter((line): line is string => line !== null);
}

export function buildIcsContent(event: IcsEvent, siteUrl: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TP Tour//Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    ...buildVeventLines(event, siteUrl),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

interface IcsPerson {
  name: string;
  email: string;
}

// Formatted as a proper calendar invite (METHOD:REQUEST with ORGANIZER/ATTENDEE)
// rather than a plain VCALENDAR file, so Gmail/Outlook/Apple Mail give it native
// "Add to Calendar" / RSVP handling when it lands as an email attachment.
export function buildIcsInvite(event: IcsEvent, siteUrl: string, organizer: IcsPerson, attendee: IcsPerson): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TP Tour//Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    ...buildVeventLines(event, siteUrl),
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    `ORGANIZER;CN=${escapeIcsText(organizer.name)}:mailto:${organizer.email}`,
    `ATTENDEE;CN=${escapeIcsText(attendee.name)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${attendee.email}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

export function buildGoogleCalendarUrl(event: IcsEvent, siteUrl: string): string {
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
