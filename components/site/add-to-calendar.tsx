import { CalendarPlus } from "lucide-react";
import { buildGoogleCalendarUrl } from "@/lib/ics";
import type { TourEvent } from "@/lib/types";

export function AddToCalendar({ event }: { event: TourEvent }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";
  const googleUrl = buildGoogleCalendarUrl(event, siteUrl);
  const icsUrl = `/api/events/${event.slug}/ics`;

  return (
    <details className="group relative border border-white/10 bg-tp-dark">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-6 py-4 text-sm font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80 transition-colors hover:text-tp-gold [&::-webkit-details-marker]:hidden">
        <CalendarPlus className="h-4 w-4" />
        Add to Calendar
      </summary>
      <div className="border-t border-white/10">
        <a
          href={googleUrl}
          target="_blank"
          rel="noreferrer"
          className="block px-6 py-3 text-sm text-tp-offwhite/70 hover:bg-white/[0.03] hover:text-tp-gold"
        >
          Google Calendar
        </a>
        <a
          href={icsUrl}
          className="block border-t border-white/10 px-6 py-3 text-sm text-tp-offwhite/70 hover:bg-white/[0.03] hover:text-tp-gold"
        >
          Download .ics (Apple / Outlook)
        </a>
      </div>
    </details>
  );
}
