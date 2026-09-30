import { notFound } from "next/navigation";
import Image from "next/image";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import { getEventEntriesAdmin } from "@/lib/data/admin";
import { generateTeeSheet, updateGroupStartingHoles, applyTeeTimesToGroups } from "@/lib/actions/admin-events";
import { Button, LinkButton } from "@/components/ui/button";
import { PrintButton } from "@/components/admin/print-button";
import { AutoToast } from "@/components/admin/auto-toast";
import { Field, inputClass } from "@/components/admin/form";
import { GroupBoard, type BoardEntry } from "@/components/admin/group-board";
import { formatEventDateLong, formatHandicap, tbc } from "@/lib/format";
import type { TourEvent } from "@/lib/types";

interface EntryRow {
  id: string;
  status: string;
  is_guest: boolean;
  guest_name: string | null;
  tee_time: string | null;
  group_number: number | null;
  group_position: number | null;
  starting_hole: number | null;
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

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function chunkPairs<T>(list: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
  return rows;
}

export default async function DaySheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ generated?: string; groupsSaved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { generated, groupsSaved, error: errorMessage } = await searchParams;
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
  for (const list of grouped.values()) {
    list.sort((a, b) => (a.group_position ?? 999) - (b.group_position ?? 999));
  }
  const holeByGroup = new Map<number, number | null>();
  for (const g of grouped.keys()) holeByGroup.set(g, grouped.get(g)![0].starting_hole);
  const distinctHoles = [...new Set(grouped.keys())].length ? [...new Set([...holeByGroup.values()])].sort((a, b) => (a ?? 0) - (b ?? 0)) : [];
  const isSplitTee = distinctHoles.filter((h) => h !== null).length > 1;

  const groupNumbers = [...grouped.keys()].sort((a, b) => {
    const holeA = holeByGroup.get(a) ?? 999;
    const holeB = holeByGroup.get(b) ?? 999;
    if (holeA !== holeB) return holeA - holeB;
    return a - b;
  });
  // Plain numeric order for the Set Starting Holes input form — the hole-sorted
  // groupNumbers above is right for the printed sheet, but jumps around
  // confusingly (1,3,5...17,2,4...) once holes are set, making groups look
  // missing rather than just reordered.
  const groupNumbersAscending = [...grouped.keys()].sort((a, b) => a - b);
  const boardEntries: BoardEntry[] = entries.map((e) => ({
    id: e.id,
    name: e.is_guest ? (e.guest_name ?? "") : `${e.member_profiles?.first_name ?? ""} ${e.member_profiles?.last_name ?? ""}`.trim(),
    handicap: formatHandicap(entryHandicap(e)),
    isGuest: e.is_guest,
    groupNumber: e.group_number,
    groupPosition: e.group_position,
    teeTime: e.tee_time,
    startingHole: e.starting_hole,
  }));

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
      {groupsSaved === "1" && (
        <div className="print:hidden">
          <AutoToast message="Groups saved." variant="success" cleanHref={`/admin/events/${id}/day-sheet`} />
        </div>
      )}
      {errorMessage && (
        <div className="mt-6 border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm text-red-400 print:hidden">{errorMessage}</div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2 print:hidden">
        <div className="border border-white/10 bg-tp-dark p-6">
          <h2 className="font-heading text-sm font-bold uppercase text-tp-offwhite">Quick Auto-Split</h2>
          <p className="mt-1 text-xs text-tp-offwhite/50">
            {entries.length} confirmed player{entries.length === 1 ? "" : "s"} will be split evenly across the tee
            times, in entry order. Use this when there are no specific pairing requests.
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

        <div className="border border-white/10 bg-tp-dark p-6">
          <h2 className="font-heading text-sm font-bold uppercase text-tp-offwhite">Apply Times to Groups</h2>
          <p className="mt-1 text-xs text-tp-offwhite/50">
            Times up whatever groups are set below. Groups all get one sequence from the start time — unless you set
            starting holes first, in which case each hole gets its own sequence, all starting at the same time (a
            split tee start).
          </p>
          <form action={applyTeeTimesToGroups.bind(null, id)} className="mt-4 space-y-4">
            <Field label="Start Time">
              <input type="time" name="start_time" required className={inputClass} defaultValue={eventDetails.first_tee_time ?? ""} />
            </Field>
            <Field label="Gap Between Tee Times (minutes)">
              <input type="number" name="gap_minutes" min="1" defaultValue="10" required className={inputClass} />
            </Field>
            <Button type="submit" variant="outline" size="sm">Apply Tee Times</Button>
          </form>
        </div>
      </div>

      {groupNumbers.length > 0 && (
        <div className="mt-6 border border-white/10 bg-tp-dark p-6 print:hidden">
          <h2 className="font-heading text-sm font-bold uppercase text-tp-offwhite">Set Starting Holes (Split Tee)</h2>
          <p className="mt-1 text-xs text-tp-offwhite/50">
            Only needed for a split tee start (e.g. some groups off the 1st, others off the 18th, all at the same
            time). Leave blank for a normal single-tee start. Set a hole number per group, then use Apply Times to
            Groups above.
          </p>
          <form action={updateGroupStartingHoles.bind(null, id)} className="mt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {groupNumbersAscending.map((g) => (
                <Field key={g} label={`Group ${g}`}>
                  <input
                    type="number"
                    name={`hole_${g}`}
                    min="1"
                    max="18"
                    placeholder="Hole"
                    defaultValue={holeByGroup.get(g) ?? ""}
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>
            <Button type="submit" variant="outline" size="sm" className="mt-4">Save Starting Holes</Button>
          </form>
        </div>
      )}

      <div className="mt-6 border border-white/10 bg-tp-dark p-6 print:hidden">
        <h2 className="font-heading text-sm font-bold uppercase text-tp-offwhite">Assign Players to Groups</h2>
        <p className="mt-1 text-xs text-tp-offwhite/50">
          Drag players between groups to honour specific pairing requests, or drag onto another player within a group
          to reorder them. Changes save automatically. Use + Add Group for a new empty 4-ball.
        </p>
        <div className="mt-4">
          <GroupBoard eventId={id} entries={boardEntries} />
        </div>
      </div>

      {/* Day sheet — this is what prints, previewed here in its printed styling */}
      <div className="mx-auto mt-10 max-w-3xl overflow-hidden border border-black/10 bg-white text-black print:mt-0 print:max-w-none print:border-0">
        <div
          className="flex items-center justify-between bg-tp-black px-10 py-6"
          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", colorAdjust: "exact" }}
        >
          <Image src="/logo.png" alt="TP Tour" width={800} height={150} className="h-8 w-auto" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-tp-gold">Day Sheet</p>
        </div>

        <div className="p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
          <h2 className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight text-tp-black">{eventDetails.name}</h2>
          <p className="mt-2 text-black/70">
            {tbc(eventDetails.golf_clubs?.name)} &middot; {tbc(eventDetails.location)} &middot; {formatEventDateLong(eventDetails.event_date)}
          </p>
          <p className="mt-1 text-sm text-black/50">
            Arrival {tbc(eventDetails.arrival_time)}
          </p>

          <div className="mt-9">
            <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-tp-black">Tee Times</h3>
            {groupNumbers.length === 0 ? (
              <p className="mt-2 text-black/50">No tee times generated yet.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {groupNumbers.map((g, i) => {
                  const players = grouped.get(g)!;
                  const hole = holeByGroup.get(g) ?? null;
                  const prevHole = i > 0 ? (holeByGroup.get(groupNumbers[i - 1]) ?? null) : undefined;
                  const showHoleHeading = isSplitTee && hole !== prevHole;
                  return (
                    <div key={g}>
                      {showHoleHeading && (
                        <p className="mb-2 font-heading text-sm font-bold uppercase tracking-[0.15em] text-tp-gold">
                          {hole !== null ? `${ordinal(hole)} Tee` : "Starting Tee TBC"}
                        </p>
                      )}
                      <div
                        className="break-inside-avoid rounded-lg border-2 border-tp-black/10 p-4"
                        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", colorAdjust: "exact" }}
                      >
                        <div className="flex items-center gap-2 border-b-2 border-tp-gold pb-1.5">
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-tp-gold px-1.5 font-heading text-xs font-bold text-tp-black">
                            {g}
                          </span>
                          <p className="text-sm font-bold uppercase tracking-[0.08em] text-tp-black">
                            {tbc(players[0].tee_time)}
                            {!isSplitTee && hole !== null && ` · ${ordinal(hole)} Tee`}
                          </p>
                        </div>
                        <div className="mt-2 space-y-2">
                          {chunkPairs(players).map((pair, ri) => (
                            <div
                              key={ri}
                              className={clsx(
                                "grid grid-cols-2 gap-x-6 rounded-md border px-3 py-1.5",
                                ri % 2 === 0 ? "border-tp-gold/40 bg-tp-gold/[0.1]" : "border-tp-black/15 bg-tp-black/[0.03]",
                              )}
                              style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", colorAdjust: "exact" }}
                            >
                              {pair.map((p) => (
                                <div key={p.id} className="flex items-baseline justify-between text-sm">
                                  <span>{entryName(p)}</span>
                                  <span className="text-black/50">{formatHandicap(entryHandicap(p))}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {unassigned.length > 0 && (
              <div className="mt-6 break-inside-avoid rounded-lg border-2 border-dashed border-black/20 p-4">
                <p className="border-b-2 border-black/20 pb-1.5 text-sm font-bold uppercase tracking-[0.08em] text-tp-black">
                  Not Yet Assigned
                </p>
                <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                  {unassigned.map((p) => (
                    <li key={p.id} className="text-sm">{entryName(p)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {eventDetails.prizes && (
            <div className="mt-10 break-inside-avoid border-t-2 border-tp-gold pt-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-tp-black">Prizes</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-black/80">{eventDetails.prizes}</p>
            </div>
          )}
        </div>

        <div
          className="border-t border-black/10 bg-tp-black px-10 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-tp-offwhite/50"
          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", colorAdjust: "exact" }}
        >
          TP Tour &middot; Golf. Network. Compete. &middot; Dubai, United Arab Emirates
        </div>
      </div>
    </div>
  );
}
