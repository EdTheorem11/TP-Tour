import Link from "next/link";
import { getAllEventsAdmin } from "@/lib/data/admin";
import { formatEventDateLong, tbc } from "@/lib/format";

export default async function AdminResultsPage() {
  const events = await getAllEventsAdmin();
  const relevant = events.filter((e) => e.status === "completed" || e.results_published);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Results</h1>
      <p className="mt-2 text-sm text-tp-offwhite/50">
        Publish results and make corrections from the scoring screen for each event.
      </p>

      <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
        {relevant.length === 0 ? (
          <p className="py-8 text-tp-offwhite/50">No completed events yet.</p>
        ) : (
          relevant.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-semibold text-tp-offwhite">{e.name}</p>
                <p className="text-xs text-tp-offwhite/50">{formatEventDateLong(e.event_date)} &middot; {tbc(e.location)}</p>
              </div>
              <div className="flex gap-4 text-xs font-semibold uppercase tracking-[0.1em]">
                <span className={e.results_published ? "text-tp-green-light" : "text-tp-gold"}>
                  {e.results_published ? "Published" : "Not Published"}
                </span>
                <Link href={`/admin/scoring/${e.id}`} className="text-tp-offwhite/70 hover:text-tp-gold">
                  Manage Scores &amp; Results
                </Link>
                {e.results_published && (
                  <Link href={`/results/${e.slug}`} className="text-tp-offwhite/70 hover:text-tp-gold">
                    View Public Page
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
