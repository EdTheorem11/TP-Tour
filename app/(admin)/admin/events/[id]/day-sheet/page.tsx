import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getEventEntriesAdmin } from "@/lib/data/admin";
import { generateTeeSheet, updateEntryGroups, updateGroupStartingHoles, applyTeeTimesToGroups } from "@/lib/actions/admin-events";
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
  // Grouped by current group number (unassigned last), then by position within
  // the group, so it's easy to see each 4-ball together in printed order while
  // swapping people or reordering them.
  const entriesForAssignment = [...entries].sort((a, b) => {
    const groupA = a.group_number ?? Infinity;
    const groupB = b.group_number ?? Infinity;
    if (groupA !== groupB) return groupA - groupB;
    const posA = a.group_position ?? 999;
    const posB = b.group_position ?? 999;
    if (posA !== posB) return posA - posB;
    return entryName(a).localeCompare(entryName(b));
  });

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
              {groupNumbers.map((g) => (
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
          Set a group number for each player to honour specific pairing requests. Players sharing a group number will
          be grouped together once you apply tee times above. Use Pos to control their order within the group (e.g.
          on the printed sheet or scorecard) — lowest goes first. Leave blank to leave someone unassigned.
        </p>
        <form action={updateEntryGroups.bind(null, id)} className="mt-4">
          <div className="max-h-96 overflow-y-auto border border-white/10">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-tp-dark">
                <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Hcp</th>
                  <th className="w-20 px-3 py-2">Group</th>
                  <th className="w-16 px-3 py-2">Pos</th>
                </tr>
              </thead>
              <tbody>
                {entriesForAssignment.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/5">
                    <td className="px-3 py-2 text-tp-offwhite">{entryName(entry)}</td>
                    <td className="px-3 py-2 text-tp-offwhite/60">{formatHandicap(entryHandicap(entry))}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name={`group_${entry.id}`}
                        min="1"
                        defaultValue={entry.group_number ?? ""}
                        className={`${inputClass} py-1.5`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        name={`position_${entry.id}`}
                        min="1"
                        max="4"
                        defaultValue={entry.group_position ?? ""}
                        className={`${inputClass} py-1.5`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="submit" variant="gold" size="sm" className="mt-4">Save Groups</Button>
        </form>
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
                      <div className="break-inside-avoid">
                        <div
                          className="flex items-center gap-2 border-b-2 border-tp-gold pb-1.5"
                          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", colorAdjust: "exact" }}
                        >
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-tp-gold px-1.5 font-heading text-xs font-bold text-tp-black">
                            {g}
                          </span>
                          <p className="text-sm font-bold uppercase tracking-[0.08em] text-tp-black">
                            {tbc(players[0].tee_time)}
                            {!isSplitTee && hole !== null && ` · ${ordinal(hole)} Tee`}
                          </p>
                        </div>
                        <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                          {players.map((p) => (
                            <li key={p.id} className="flex items-baseline justify-between text-sm">
                              <span>{entryName(p)}</span>
                              <span className="text-black/50">{formatHandicap(entryHandicap(p))}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {unassigned.length > 0 && (
              <div className="mt-6 break-inside-avoid">
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
