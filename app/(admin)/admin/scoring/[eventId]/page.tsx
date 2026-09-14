import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventEntriesAdmin, getEventScoresAdmin, getEventResultsAdmin } from "@/lib/data/admin";
import { Field, inputClass } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { PublishResultsButton } from "@/components/admin/publish-results-button";
import { RecalculateResultsButton } from "@/components/admin/recalculate-results-button";
import { saveEventScores, overrideResultPosition, bulkUploadScores } from "@/lib/actions/admin-scoring";
import type { TourEvent } from "@/lib/types";

interface EntryRow {
  id: string;
  member_id: string;
  playing_handicap: number | null;
  is_guest: boolean;
  member_profiles: { first_name: string; last_name: string; current_handicap: number | null } | null;
}
interface ScoreRow {
  member_id: string;
  playing_handicap: number | null;
  stableford_points: number | null;
  gross_score: number | null;
  nett_score: number | null;
}
interface ResultRow {
  id: string;
  member_id: string;
  position: number;
  position_display: string;
  oom_points: number;
  manually_overridden: boolean;
  member_profiles: { first_name: string; last_name: string } | null;
}

export default async function AdminScoringForEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ imported?: string; skipped?: string; importError?: string }>;
}) {
  const { eventId } = await params;
  const { imported, skipped, importError } = await searchParams;
  const supabase = await createClient();
  const { data: eventData } = await supabase.from("events").select("*").eq("id", eventId).single();
  if (!eventData) notFound();
  const event = eventData as TourEvent;

  const [entries, scores, results] = await Promise.all([
    getEventEntriesAdmin(eventId) as Promise<EntryRow[]>,
    getEventScoresAdmin(eventId) as Promise<ScoreRow[]>,
    getEventResultsAdmin(eventId) as Promise<ResultRow[]>,
  ]);

  const scoreByMember = new Map(scores.map((s) => [s.member_id, s]));
  const isStrokeplay = event.format === "strokeplay";
  // Guests aren't scored — they'd collide on member_id (they share their
  // host's) and have no path into the Order of Merit anyway.
  const confirmedEntries = entries.filter((e) => e.member_profiles && !e.is_guest);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">{event.name} &mdash; Scoring</h1>
      <p className="mt-2 text-sm text-tp-offwhite/50">
        {isStrokeplay ? "Strokeplay" : "Stableford"} &middot; {confirmedEntries.length} players entered
      </p>

      {imported !== undefined && (
        <div className="mt-6 border border-tp-green/40 bg-tp-green/10 px-5 py-3 text-sm text-tp-green-light">
          Imported scores for {imported} player{imported === "1" ? "" : "s"}.
          {skipped && <span className="block text-tp-gold">Skipped (no matching member email): {skipped}</span>}
        </div>
      )}
      {importError && (
        <div className="mt-6 border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm text-red-400">{importError}</div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border border-white/10 bg-tp-dark px-5 py-4">
        <a
          href={`/api/admin/scoring/${eventId}/template`}
          className="border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80 hover:border-tp-gold hover:text-tp-gold"
        >
          Download Scoring Template
        </a>
        <form action={bulkUploadScores.bind(null, eventId)} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="scores_csv"
            accept=".csv,text/csv"
            required
            className="text-sm text-tp-offwhite/70 file:mr-3 file:border file:border-white/15 file:bg-tp-black file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.1em] file:text-tp-offwhite"
          />
          <Button type="submit" variant="outline" size="sm">Upload Scores CSV</Button>
        </form>
        <p className="w-full text-xs text-tp-offwhite/40">
          Download the template, fill in scores against each player&rsquo;s email, then upload it here &mdash; faster than typing scores into the table below one at a time.
        </p>
      </div>

      <form action={saveEventScores.bind(null, eventId)} className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">
              <th className="py-3 pr-4">Player</th>
              <th className="py-3 pr-4">Playing Hcp</th>
              {isStrokeplay ? (
                <>
                  <th className="py-3 pr-4">Gross</th>
                  <th className="py-3 pr-4">Nett</th>
                </>
              ) : (
                <th className="py-3 pr-4">Stableford</th>
              )}
            </tr>
          </thead>
          <tbody>
            {confirmedEntries.map((entry) => {
              const existing = scoreByMember.get(entry.member_id);
              return (
                <tr key={entry.id} className="border-b border-white/5">
                  <td className="py-3 pr-4 text-tp-offwhite">
                    {entry.member_profiles?.first_name} {entry.member_profiles?.last_name}
                    <input type="hidden" name={`member_${entry.member_id}`} value="1" />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      step="0.1"
                      name={`handicap_${entry.member_id}`}
                      defaultValue={existing?.playing_handicap ?? entry.playing_handicap ?? entry.member_profiles?.current_handicap ?? ""}
                      className={inputClass + " w-24"}
                    />
                  </td>
                  {isStrokeplay ? (
                    <>
                      <td className="py-3 pr-4">
                        <input type="number" name={`gross_${entry.member_id}`} defaultValue={existing?.gross_score ?? ""} className={inputClass + " w-24"} />
                      </td>
                      <td className="py-3 pr-4">
                        <input type="number" step="0.1" name={`nett_${entry.member_id}`} defaultValue={existing?.nett_score ?? ""} className={inputClass + " w-24"} />
                      </td>
                    </>
                  ) : (
                    <td className="py-3 pr-4">
                      <input type="number" name={`stableford_${entry.member_id}`} defaultValue={existing?.stableford_points ?? ""} className={inputClass + " w-24"} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {confirmedEntries.length === 0 ? (
          <p className="py-6 text-tp-offwhite/50">No confirmed entries for this event yet.</p>
        ) : (
          <Button type="submit" variant="outline" size="sm" className="mt-4">Save Scores</Button>
        )}
      </form>

      {confirmedEntries.length > 0 && (
        <div className="mt-8 border-t border-white/10 pt-8">
          {event.results_published ? (
            <div>
              <p className="text-sm text-tp-green-light">Results have been published for this event.</p>
              <p className="mt-1 text-xs text-tp-offwhite/40">
                Changed a score since publishing? Recalculate to push the correction to the public site &mdash; this
                won&rsquo;t re-notify players.
              </p>
              <div className="mt-4">
                <RecalculateResultsButton eventId={eventId} />
              </div>
            </div>
          ) : (
            <PublishResultsButton eventId={eventId} />
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Results &amp; Corrections</h2>
          <div className="mt-4 space-y-2">
            {results.map((r) => (
              <form
                key={r.id}
                action={async (fd: FormData) => {
                  "use server";
                  await overrideResultPosition(
                    eventId,
                    r.id,
                    Number(fd.get("position")),
                    String(fd.get("position_display")),
                    Number(fd.get("oom_points")),
                    String(fd.get("reason") ?? ""),
                  );
                }}
                className="border border-white/10 bg-tp-dark px-4 py-4 text-sm"
              >
                <p className="text-tp-offwhite">
                  {r.member_profiles?.first_name} {r.member_profiles?.last_name}
                  {r.manually_overridden && <span className="ml-2 text-[10px] uppercase text-tp-gold">Overridden</span>}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[6rem_6rem_7rem_1fr_auto] lg:items-end">
                  <Field label="Position">
                    <input name="position" type="number" defaultValue={r.position} className={inputClass} />
                  </Field>
                  <Field label="Display">
                    <input name="position_display" defaultValue={r.position_display} className={inputClass} />
                  </Field>
                  <Field label="OOM Points">
                    <input name="oom_points" type="number" step="0.1" defaultValue={r.oom_points} className={inputClass} />
                  </Field>
                  <Field label="Reason for Override">
                    <input name="reason" placeholder="Reason" className={inputClass} />
                  </Field>
                  <button className="whitespace-nowrap py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-tp-gold hover:underline">
                    Override
                  </button>
                </div>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
