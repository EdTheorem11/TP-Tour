"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/button";
import { enterEvent, joinEventWaitingList, withdrawFromEvent, addGuest } from "@/lib/actions/events";
import type { MemberProfile } from "@/lib/types";

type Stage = "idle" | "confirm" | "done";

interface Guest {
  id: string;
  guest_name: string | null;
  playing_handicap: number | null;
}

export function EntryPanel({
  eventId,
  eventSlug,
  eventName,
  eventDate,
  isLoggedIn,
  profile,
  existingEntry,
  waitingListEntry,
  spacesRemaining,
  myGuests,
}: {
  eventId: string;
  eventSlug: string;
  eventName: string;
  eventDate: string;
  isLoggedIn: boolean;
  profile: MemberProfile | null;
  existingEntry: { id: string; status: string } | null;
  waitingListEntry: { id: string; position: number } | null;
  spacesRemaining: number | null;
  myGuests: Guest[];
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestHandicap, setGuestHandicap] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestPending, startGuestTransition] = useTransition();

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
        <p className="font-heading text-xl font-bold uppercase text-tp-green-light">
          You are in {eventName} on {eventDate}.
        </p>
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

        <div className="mt-6 border-t border-tp-green/20 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">Your Guests</p>

          {myGuests.length > 0 && (
            <ul className="mt-3 space-y-2">
              {myGuests.map((guest) => (
                <li key={guest.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-tp-offwhite">
                    {guest.guest_name}
                    {guest.playing_handicap != null && (
                      <span className="text-tp-offwhite/50"> &middot; Hcp {guest.playing_handicap}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    className="text-xs uppercase tracking-[0.05em] text-red-400 hover:underline disabled:opacity-40"
                    onClick={() =>
                      startTransition(async () => {
                        await withdrawFromEvent(eventSlug, guest.id);
                        router.refresh();
                      })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showGuestForm ? (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Guest name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full border border-white/15 bg-tp-dark px-3 py-2 text-sm text-tp-offwhite placeholder:text-tp-offwhite/30 focus:border-tp-gold focus:outline-none"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Handicap (optional)"
                value={guestHandicap}
                onChange={(e) => setGuestHandicap(e.target.value)}
                className="w-full border border-white/15 bg-tp-dark px-3 py-2 text-sm text-tp-offwhite placeholder:text-tp-offwhite/30 focus:border-tp-gold focus:outline-none"
              />
              {guestError && <p className="text-xs text-red-400">{guestError}</p>}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={guestPending}
                  onClick={() =>
                    startGuestTransition(async () => {
                      setGuestError(null);
                      const result = await addGuest(
                        eventSlug,
                        eventId,
                        guestName,
                        guestHandicap.trim() === "" ? null : Number(guestHandicap),
                      );
                      if (result.error) {
                        setGuestError(result.error);
                        return;
                      }
                      setGuestName("");
                      setGuestHandicap("");
                      setShowGuestForm(false);
                      router.refresh();
                    })
                  }
                >
                  {guestPending ? "Adding…" : "Add Guest"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowGuestForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowGuestForm(true)}
              className="mt-3 text-sm text-tp-gold hover:underline"
            >
              + Add a Guest
            </button>
          )}
        </div>
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
