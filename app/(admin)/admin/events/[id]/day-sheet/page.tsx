import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getEventEntriesAdmin } from "@/lib/data/admin";
import { generateTeeSheet } from "@/lib/actions/admin-events";
import { Button, LinkButton } from "@/components/ui/button";
import { PrintButton } from "@/components/admin/print-button";
import { AutoToast } from "@/components/admin/auto-toast";
import { Field, inputClass } from "@/components/admin/form";
import { formatEventDateLong, formatHandicap, tbc } from "@/lib/format";
import type { TourEvent } from "@/lib/types";

interface EntryRow {
  id: string;
  status: string;
  is_guest: boolean;
  guest_name: string | null;
  tee_time: string | null;
  group_number: number | null;
  playing_handicap: number | null;
  member_profiles: { first_name: string; last_name: string; current_handicap: number | null } | null;
}

function entryName(entry: EntryRow): string {
  if (entry.is_guest) return `${entry.guest_name} (Guest)`;
  return `${entry.member_profiles?.first_name ?? ""} ${entry.member_profiles?.last_name ?? ""}`.trim();
}

function entryHandicap(entry: EntryRow): number | null {
  return entry.is_guest ? entry.playing_handicap : (entry.member_profiles?.current_handicap ?? null);
}

export default async function DaySheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ generated?: string; error?: string }>;
}) {
  const { id } = await params;
  const { generated, error: errorMessage } = await searchParams;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*, golf_clubs(name)").eq("id", id).single();
  if (!event) notFound();

  const eventDetails = event as TourEvent & { golf_clubs: { name: string } | null };
  const entries = ((await getEventEntriesAdmin(id)) as EntryRow[]).filter((e) => e.status === "confirmed");

  const grouped = new Map<number, EntryRow[]>();
  const unassigned: EntryRow[] = [];
  for (const entry of entries) {
    if (entry.group_number === null) {
      unassigned.push(entry);
    } else {
      const list = grouped.get(entry.group_number) ?? [];
      list.push(entry);
      grouped.set(entry.group_number, list);
    }
  }
  const groupNumbers = [...grouped.keys()].sort((a, b) => a - b);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">
          {eventDetails.name} &mdash; Day Sheet
        </h1>
        <div className="flex gap-3">
          <LinkButton href={`/admin/events/${id}`} variant="outline" size="sm">Back to Event</LinkButton>
          <PrintButton />
        </div>
      </div>

      {generated === "1" && (
        <div className="print:hidden">
          <AutoToast message="Tee times generated." variant="success" cleanHref={`/admin/events/${id}/day-sheet`} />
        </div>
      )}
      {errorMessage && (
        <div className="mt-6 border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm text-red-400 print:hidden">{errorMessage}</div>
      )}

      <div className="mt-8 max-w-md border border-white/10 bg-tp-dark p-6 print:hidden">
        <h2 className="font-heading text-sm font-bold uppercase text-tp-offwhite">Generate Tee Times</h2>
        <p className="mt-1 text-xs text-tp-offwhite/50">
          {entries.length} confirmed player{entries.length === 1 ? "" : "s"} will be split evenly across the tee
          times, in entry order. Re-generating overwrites the assignment below.
        </p>
        <form action={generateTeeSheet.bind(null, id)} className="mt-4 space-y-4">
          <Field label="Start Time">
            <input type="time" name="start_time" required className={inputClass} defaultValue={eventDetails.first_tee_time ?? ""} />
          </Field>
          <Field label="Gap Between Tee Times (minutes)">
            <input type="number" name="gap_minutes" min="1" defaultValue="10" required className={inputClass} />
          </Field>
          <Field label="Number of Tee Times">
            <input type="number" name="tee_time_count" min="1" required className={inputClass} />
          </Field>
          <Button type="submit" variant="gold" size="sm">Generate</Button>
        </form>
      </div>

      {/* Day sheet — this is what prints, previewed here in its printed (light) styling */}
      <div className="mx-auto mt-10 max-w-3xl bg-white p-10 text-black print:mt-0 print:max-w-none print:p-0">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <Image src="/logo.png" alt="TP Tour" width={800} height={150} className="h-9 w-auto" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Day Sheet</p>
        </div>

        <h2 className="mt-6 text-3xl font-bold uppercase">{eventDetails.name}</h2>
        <p className="mt-1 text-black/70">
          {tbc(eventDetails.golf_clubs?.name)} &middot; {tbc(eventDetails.location)} &middot; {formatEventDateLong(eventDetails.event_date)}
        </p>
        <p className="mt-1 text-sm text-black/60">
          Arrival {tbc(eventDetails.arrival_time)}
        </p>

        <div className="mt-8">
          <h3 className="text-lg font-bold uppercase">Tee Times</h3>
          {groupNumbers.length === 0 ? (
            <p className="mt-2 text-black/50">No tee times generated yet.</p>
          ) : (
            <div className="mt-3 space-y-5">
              {groupNumbers.map((g) => {
                const players = grouped.get(g)!;
                return (
                  <div key={g} className="break-inside-avoid">
                    <p className="border-b border-black/20 pb-1 text-sm font-bold uppercase tracking-[0.08em]">
                      {players[0].tee_time} &middot; Group {g}
                    </p>
                    <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                      {players.map((p) => (
                        <li key={p.id} className="flex items-baseline justify-between text-sm">
                          <span>{entryName(p)}</span>
                          <span className="text-black/50">{formatHandicap(entryHandicap(p))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {unassigned.length > 0 && (
            <div className="mt-6 break-inside-avoid">
              <p className="border-b border-black/20 pb-1 text-sm font-bold uppercase tracking-[0.08em]">Not Yet Assigned</p>
              <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                {unassigned.map((p) => (
                  <li key={p.id} className="text-sm">{entryName(p)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {eventDetails.prizes && (
          <div className="mt-10 break-inside-avoid border-t-2 border-black pt-4">
            <h3 className="text-lg font-bold uppercase">Prizes</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-black/80">{eventDetails.prizes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
