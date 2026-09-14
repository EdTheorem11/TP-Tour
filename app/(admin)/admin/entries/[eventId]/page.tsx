import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventEntriesAdmin, getEventWaitingListAdmin } from "@/lib/data/admin";
import { inputClass } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { PaymentStatusSelect } from "@/components/admin/payment-status-select";
import { PrintButton } from "@/components/admin/print-button";
import {
  addEntryByEmail,
  removeEntry,
  promoteWaitingListEntry,
  removeFromWaitingList,
} from "@/lib/actions/admin-events";
import { formatEventDateLong, formatHandicap, formatPrice, tbc } from "@/lib/format";
import type { TourEvent, PaymentStatus } from "@/lib/types";

interface EntryRow {
  id: string;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  entry_date: string;
  is_guest: boolean;
  guest_name: string | null;
  playing_handicap: number | null;
  member_profiles: { first_name: string; last_name: string; company: string | null; current_handicap: number | null } | null;
}

function entryName(entry: EntryRow): string {
  if (!entry.is_guest) return `${entry.member_profiles?.first_name ?? ""} ${entry.member_profiles?.last_name ?? ""}`.trim();
  return `${entry.guest_name} (Guest of ${entry.member_profiles?.first_name} ${entry.member_profiles?.last_name})`;
}

function entryHandicap(entry: EntryRow): number | null {
  return entry.is_guest ? entry.playing_handicap : (entry.member_profiles?.current_handicap ?? null);
}

interface WaitingRow {
  id: string;
  position: number;
  member_profiles: { first_name: string; last_name: string; current_handicap: number | null } | null;
}

export default async function AdminEntriesForEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ added?: string; error?: string }>;
}) {
  const { eventId } = await params;
  const { added, error: errorMessage } = await searchParams;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single();
  if (!event) notFound();

  const [entries, waitingList] = await Promise.all([
    getEventEntriesAdmin(eventId) as Promise<EntryRow[]>,
    getEventWaitingListAdmin(eventId) as Promise<WaitingRow[]>,
  ]);

  const confirmed = entries.filter((e) => e.status === "confirmed");

  const eventDetails = event as TourEvent;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">
          {eventDetails.name} &mdash; Entries
        </h1>
        <div className="flex gap-3">
          <a
            href={`/api/admin/entries/${eventId}/export`}
            className="border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80 hover:border-tp-gold hover:text-tp-gold"
          >
            Download CSV
          </a>
          <PrintButton />
        </div>
      </div>

      {added === "1" && (
        <div className="mt-6 border border-tp-green/40 bg-tp-green/10 px-5 py-3 text-sm text-tp-green-light print:hidden">
          Player added.
        </div>
      )}
      {errorMessage && (
        <div className="mt-6 border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm text-red-400 print:hidden">
          {errorMessage}
        </div>
      )}

      <div className="hidden print:block">
        <h1 className="text-2xl font-bold text-black">{eventDetails.name}</h1>
        <p className="mt-1 text-black">
          {formatEventDateLong(eventDetails.event_date)} &middot; {tbc(eventDetails.location)}
        </p>
        <p className="mt-1 text-black">
          Arrival {tbc(eventDetails.arrival_time)} &middot; Tee Time {tbc(eventDetails.first_tee_time ?? eventDetails.shotgun_time)}
        </p>
        <table className="mt-6 w-full border-collapse text-left text-sm text-black">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Player</th>
              <th className="py-2 pr-4">Hcp</th>
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Payment</th>
            </tr>
          </thead>
          <tbody>
            {confirmed.map((entry, i) => (
              <tr key={entry.id} className="border-b border-black/30">
                <td className="py-2 pr-4">{i + 1}</td>
                <td className="py-2 pr-4">{entryName(entry)}</td>
                <td className="py-2 pr-4">{formatHandicap(entryHandicap(entry))}</td>
                <td className="py-2 pr-4">{entry.is_guest ? "—" : tbc(entry.member_profiles?.company)}</td>
                <td className="py-2 pr-4">{entry.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={addEntryByEmail.bind(null, eventId)} className="mt-8 flex max-w-md gap-3 print:hidden">
        <input name="email" type="email" required placeholder="Member email" className={inputClass} />
        <Button type="submit" variant="gold" size="sm">Add Player</Button>
      </form>
      <p className="mt-2 text-xs text-tp-offwhite/40 print:hidden">
        The member must already have an account (any status) before they can be added this way.
      </p>

      <div className="mt-8 overflow-x-auto print:hidden">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">
              <th className="py-3 pr-4">Player</th>
              <th className="py-3 pr-4">Hcp</th>
              <th className="py-3 pr-4">Company</th>
              <th className="py-3 pr-4">Entry Date</th>
              <th className="py-3 pr-4">Payment</th>
              <th className="py-3 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {confirmed.map((entry) => (
              <tr key={entry.id} className="border-b border-white/5">
                <td className="py-3 pr-4 text-tp-offwhite">{entryName(entry)}</td>
                <td className="py-3 pr-4 text-tp-offwhite/60">{formatHandicap(entryHandicap(entry))}</td>
                <td className="py-3 pr-4 text-tp-offwhite/60">{entry.is_guest ? "—" : tbc(entry.member_profiles?.company)}</td>
                <td className="py-3 pr-4 text-tp-offwhite/60">{new Date(entry.entry_date).toLocaleDateString("en-GB")}</td>
                <td className="py-3 pr-4">
                  <PaymentStatusSelect eventId={eventId} entryId={entry.id} defaultValue={entry.payment_status as PaymentStatus} />
                </td>
                <td className="py-3 pr-4">
                  <form action={removeEntry.bind(null, eventId, entry.id)}>
                    <button className="text-xs text-red-400 hover:underline">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {confirmed.length === 0 && <p className="py-6 text-tp-offwhite/50">No confirmed entries yet.</p>}
      </div>

      {(event as TourEvent).member_price && (
        <p className="mt-2 text-xs text-tp-offwhite/40">Member price: {formatPrice((event as TourEvent).member_price)}</p>
      )}

      <div className="mt-12">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Waiting List</h2>
        {waitingList.length === 0 ? (
          <p className="mt-3 text-sm text-tp-offwhite/50">No one is waiting.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {waitingList.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-3">
                <span className="text-tp-offwhite">
                  #{w.position} &middot; {w.member_profiles?.first_name} {w.member_profiles?.last_name}
                  <span className="ml-2 text-xs text-tp-offwhite/40">Hcp {formatHandicap(w.member_profiles?.current_handicap)}</span>
                </span>
                <div className="flex gap-4">
                  <form action={promoteWaitingListEntry.bind(null, eventId, w.id)}>
                    <button className="text-xs text-tp-green-light hover:underline">Promote</button>
                  </form>
                  <form action={removeFromWaitingList.bind(null, eventId, w.id)}>
                    <button className="text-xs text-red-400 hover:underline">Remove</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
