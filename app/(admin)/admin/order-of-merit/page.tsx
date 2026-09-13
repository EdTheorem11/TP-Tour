import { getAllSeasonsAdmin, getOomAdjustmentsAdmin, getAllMembersAdmin, getAllEventsAdmin } from "@/lib/data/admin";
import { getOrderOfMerit } from "@/lib/data/site";
import { Field, inputClass } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { createSeason, updateSeasonOomConfig, addOomAdjustment, recalcOrderOfMerit } from "@/lib/actions/admin-content";
import { formatHandicap } from "@/lib/format";

export default async function AdminOrderOfMeritPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const params = await searchParams;
  const seasons = await getAllSeasonsAdmin();
  const season = seasons.find((s) => s.id === params.season) ?? seasons.find((s) => s.is_current) ?? seasons[0];

  const [standings, adjustments, members, events] = await Promise.all([
    season ? getOrderOfMerit(season.id) : Promise.resolve([]),
    season ? getOomAdjustmentsAdmin(season.id) : Promise.resolve([]),
    getAllMembersAdmin(),
    getAllEventsAdmin(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Order of Merit</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {seasons.map((s) => (
          <a
            key={s.id}
            href={`/admin/order-of-merit?season=${s.id}`}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${
              season?.id === s.id ? "bg-tp-gold text-tp-black" : "border border-white/15 text-tp-offwhite/70"
            }`}
          >
            {s.name}
          </a>
        ))}
      </div>

      <details className="mt-6 max-w-md">
        <summary className="cursor-pointer text-sm text-tp-gold">+ Create New Season</summary>
        <form action={createSeason} className="mt-4 space-y-4">
          <Field label="Name"><input name="name" required placeholder="2027/28" className={inputClass} /></Field>
          <Field label="Start Date"><input type="date" name="start_date" required className={inputClass} /></Field>
          <Field label="End Date"><input type="date" name="end_date" className={inputClass} /></Field>
          <label className="flex items-center gap-2 text-sm text-tp-offwhite/70">
            <input type="checkbox" name="is_current" /> Set as current season
          </label>
          <Button type="submit" variant="outline" size="sm">Create Season</Button>
        </form>
      </details>

      {season && (
        <>
          <div className="mt-10 border-t border-white/10 pt-8">
            <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Points Configuration &mdash; {season.name}</h2>
            <form action={updateSeasonOomConfig.bind(null, season.id)} className="mt-4 space-y-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">Position Points</p>
                <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((pos) => (
                    <div key={pos}>
                      <label className="mb-1 block text-[10px] text-tp-offwhite/40">{pos}{pos === 1 ? "st" : pos === 2 ? "nd" : pos === 3 ? "rd" : "th"}</label>
                      <input
                        type="number"
                        name={`points_${pos}`}
                        defaultValue={season.oom_points_table[String(pos)] ?? ""}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Default Points (below table)">
                  <input type="number" name="oom_default_points" defaultValue={season.oom_default_points} className={inputClass} />
                </Field>
                <Field label="Major Bonus Multiplier">
                  <input type="number" step="0.1" name="oom_major_multiplier" defaultValue={season.oom_major_multiplier} className={inputClass} />
                </Field>
                <Field label="Best Results Count (blank = all)">
                  <input type="number" name="oom_best_results_count" defaultValue={season.oom_best_results_count ?? ""} className={inputClass} />
                </Field>
                <Field label="Attendance Points">
                  <input type="number" step="0.1" name="oom_attendance_points" defaultValue={season.oom_attendance_points} className={inputClass} />
                </Field>
              </div>

              <Button type="submit" variant="gold" size="sm">Save Configuration</Button>
            </form>
          </div>

          <div className="mt-10 border-t border-white/10 pt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Manual Adjustments</h2>
              <form action={recalcOrderOfMerit.bind(null, season.id)}>
                <Button type="submit" variant="outline" size="sm">Recalculate Standings</Button>
              </form>
            </div>

            <form action={addOomAdjustment.bind(null, season.id)} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              <Field label="Player">
                <select name="member_id" required className={inputClass}>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                </select>
              </Field>
              <Field label="Event (optional)">
                <select name="event_id" className={inputClass}>
                  <option value="">None</option>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </Field>
              <Field label="Points Adjustment">
                <input type="number" step="0.1" name="points_adjustment" required className={inputClass} />
              </Field>
              <Field label="Reason">
                <input name="reason" required className={inputClass} />
              </Field>
              <Button type="submit" variant="gold" size="sm">Add Adjustment</Button>
            </form>

            {adjustments.length > 0 && (
              <ul className="mt-6 space-y-2 text-sm text-tp-offwhite/60">
                {(adjustments as Array<{ id: string; points_adjustment: number; reason: string; member_profiles: { first_name: string; last_name: string } | null }>).map((a) => (
                  <li key={a.id}>
                    {a.member_profiles?.first_name} {a.member_profiles?.last_name}: {a.points_adjustment > 0 ? "+" : ""}{a.points_adjustment} pts &mdash; {a.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-10 border-t border-white/10 pt-8">
            <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Standings</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">
                    <th className="py-3 pr-4">Pos</th>
                    <th className="py-3 pr-4">Player</th>
                    <th className="py-3 pr-4">Hcp</th>
                    <th className="py-3 pr-4">Events</th>
                    <th className="py-3 pr-4">Total</th>
                    <th className="py-3 pr-4">Dropped</th>
                    <th className="py-3 text-right">Counting</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s) => {
                    const isTied = s.rank !== null && standings.filter((r) => r.rank === s.rank).length > 1;
                    return (
                      <tr key={s.id} className="border-b border-white/5">
                        <td className="py-3 pr-4">{s.rank === null ? "—" : isTied ? `T${s.rank}` : s.rank}</td>
                        <td className="py-3 pr-4 text-tp-offwhite">{s.member_profiles?.first_name} {s.member_profiles?.last_name}</td>
                        <td className="py-3 pr-4 text-tp-offwhite/60">{formatHandicap(s.member_profiles?.current_handicap)}</td>
                        <td className="py-3 pr-4 text-tp-offwhite/60">{s.events_played}</td>
                        <td className="py-3 pr-4 text-tp-offwhite/60">{s.total_points}</td>
                        <td className="py-3 pr-4 text-tp-offwhite/40">{s.dropped_points}</td>
                        <td className="py-3 text-right font-semibold text-tp-gold">{s.counting_points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {standings.length === 0 && <p className="py-6 text-tp-offwhite/50">No standings yet.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
