"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/button";
import { enterEvent, joinEventWaitingList, withdrawFromEvent } from "@/lib/actions/events";
import { formatPrice } from "@/lib/format";
import type { MemberProfile } from "@/lib/types";

type Stage = "idle" | "confirm" | "done";

export function EntryPanel({
  eventId,
  eventSlug,
  eventName,
  eventDate,
  memberPrice,
  isLoggedIn,
  profile,
  existingEntry,
  waitingListEntry,
  spacesRemaining,
}: {
  eventId: string;
  eventSlug: string;
  eventName: string;
  eventDate: string;
  memberPrice: number | null;
  isLoggedIn: boolean;
  profile: MemberProfile | null;
  existingEntry: { id: string; status: string } | null;
  waitingListEntry: { id: string; position: number } | null;
  spacesRemaining: number | null;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <div id="enter" className="border border-white/10 bg-tp-dark p-8 text-center scroll-mt-24">
        <p className="text-tp-offwhite/70">Login or create an account to enter this event.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <LinkButton href={`/login?next=/events/${eventSlug}`} variant="outline">
            Login
          </LinkButton>
          <LinkButton href="/register" variant="gold">
            Join TP Tour
          </LinkButton>
        </div>
      </div>
    );
  }

  if (existingEntry) {
    return (
      <div id="enter" className="border border-tp-green bg-tp-green/10 p-8 scroll-mt-24">
        <p className="font-heading text-xl font-bold uppercase text-tp-green-light">You&rsquo;re on the Tee Sheet.</p>
        <p className="mt-2 text-sm text-tp-offwhite/60">You are entered into {eventName}.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await withdrawFromEvent(eventSlug, existingEntry.id);
              router.refresh();
            })
          }
        >
          {pending ? "Withdrawing…" : "Withdraw"}
        </Button>
      </div>
    );
  }

  if (waitingListEntry) {
    return (
      <div id="waiting-list" className="border border-tp-gold bg-tp-gold/10 p-8 scroll-mt-24">
        <p className="font-heading text-xl font-bold uppercase text-tp-gold">You&rsquo;re on the Waiting List</p>
        <p className="mt-2 text-sm text-tp-offwhite/60">Position #{waitingListEntry.position}. We&rsquo;ll notify you if a space opens up.</p>
      </div>
    );
  }

  const isFull = spacesRemaining === 0;

  if (stage === "idle") {
    return (
      <div id="enter" className="border border-white/10 bg-tp-dark p-8 scroll-mt-24">
        <p className="text-sm text-tp-offwhite/60">
          Entering as <span className="text-tp-offwhite">{profile?.first_name} {profile?.last_name}</span> &middot;
          Handicap {profile?.current_handicap ?? "—"}
        </p>
        <Button variant={isFull ? "outline" : "gold"} size="lg" className="mt-5" onClick={() => setStage("confirm")}>
          {isFull ? "Join Waiting List" : "Enter Event"}
        </Button>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div id="enter" className="border border-tp-green bg-tp-green/10 p-8 scroll-mt-24">
        <p className="font-heading text-xl font-bold uppercase text-tp-green-light">
          {isFull ? "You're on the Waiting List." : "You're on the Tee Sheet."}
        </p>
      </div>
    );
  }

  return (
    <div id="enter" className="border border-white/10 bg-tp-dark p-8 scroll-mt-24">
      <h3 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Confirm Entry</h3>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-tp-offwhite/50">Member</dt>
          <dd>{profile?.first_name} {profile?.last_name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-tp-offwhite/50">Handicap</dt>
          <dd>{profile?.current_handicap ?? "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-tp-offwhite/50">Event</dt>
          <dd>{eventName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-tp-offwhite/50">Date</dt>
          <dd>{eventDate}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-tp-offwhite/50">Price</dt>
          <dd>{formatPrice(memberPrice)}</dd>
        </div>
      </dl>

      <label className="mt-5 flex items-start gap-3 text-sm text-tp-offwhite/70">
        <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        I agree to the competition rules and cancellation policy.
      </label>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-5 flex gap-3">
        <Button
          variant="gold"
          disabled={!agreed || pending}
          onClick={() =>
            startTransition(async () => {
              const result = isFull
                ? await joinEventWaitingList(eventSlug, eventId)
                : await enterEvent(eventSlug, eventId);
              if (result.error) setError(result.error);
              else {
                setStage("done");
                router.refresh();
              }
            })
          }
        >
          {pending ? "Confirming…" : "Confirm Entry"}
        </Button>
        <Button variant="ghost" onClick={() => setStage("idle")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
