import { MessageCircle } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";

export function WhatsAppShareButton({ eventName, eventDate, eventSlug }: { eventName: string; eventDate: string; eventSlug: string }) {
  const message = `Join me at ${eventName} on ${eventDate} — TP Tour: ${SITE_URL}/events/${eventSlug}`;
  const href = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center justify-center gap-2 border border-white/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-tp-offwhite/80 transition-colors hover:border-tp-green hover:text-tp-offwhite"
    >
      <MessageCircle className="h-4 w-4" />
      Share on WhatsApp
    </a>
  );
}
