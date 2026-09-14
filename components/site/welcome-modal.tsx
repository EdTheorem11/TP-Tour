"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { markWelcomed } from "@/lib/actions/profile";

export function WelcomeModal({
  eventName,
  eventSlug,
  eventDate,
}: {
  eventName: string;
  eventSlug: string;
  eventDate: string;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    markWelcomed();
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md border border-tp-gold bg-tp-dark p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Thank You for Joining</p>
        <h2 className="mt-4 font-heading text-3xl font-bold uppercase text-tp-offwhite">Welcome to TP Tour</h2>
        <p className="mt-4 text-tp-offwhite/60">
          Interested in <span className="text-tp-offwhite">{eventName}</span>? Sign up now to join us on{" "}
          <span className="text-tp-offwhite">{eventDate}</span>.
        </p>

        <div className="mt-6 space-y-3">
          <LinkButton href={`/events/${eventSlug}#enter`} variant="gold" size="sm" className="w-full">
            Enter {eventName}
          </LinkButton>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full text-sm text-tp-offwhite/50 hover:text-tp-offwhite"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
