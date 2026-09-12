import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/data/current-user";
import { getCurrentSeason, getPlayerOomRow, getMyNextEntry } from "@/lib/data/site";
import { formatHandicap, formatEventDateLong, tbc } from "@/lib/format";
import { FORMAT_LABELS } from "@/lib/types";

export default async function MyTpTourPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/my-tp-tour");

  const season = await getCurrentSeason();
  const [oom, nextEntry] = await Promise.all([
    season ? getPlayerOomRow(season.id, profile.id) : Promise.resolve(null),
    getMyNextEntry(profile.id),
  ]);

  const stats = [
    { label: "Handicap", value: formatHandicap(profile.current_handicap) },
    { label: "Tour Rank", value: oom?.rank ? `#${oom.rank}` : "—" },
    { label: "OOM Points", value: oom?.counting_points ?? 0 },
    { label: "Events", value: oom?.events_played ?? 0 },
    { label: "Wins", value: oom?.wins ?? 0 },
    { label: "Top 3s", value: oom?.top3 ?? 0 },
  ];

  const nextEvent = nextEntry?.events as
    | { name: string; slug: string; event_date: string; location: string | null; first_tee_time: string | null; shotgun_time: string | null; format: string | null }
    | undefined;

  return (
    <section className="py-16 lg:py-20">
      <Container>
        {profile.status === "pending" && (
          <div className="mb-8 border border-tp-gold/40 bg-tp-gold/10 px-6 py-4 text-sm text-tp-gold">
            Your membership application is pending approval. You&rsquo;ll be able to enter events once approved.
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">My TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">
          Welcome Back, <span className="text-tp-green-light">{profile.first_name}</span>.
        </h1>

        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-tp-dark px-5 py-6 text-center">
              <p className="font-heading text-3xl font-bold text-tp-gold">{s.value}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="border border-white/10 bg-tp-dark p-8">
            <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">My Next Event</h2>
            {nextEvent ? (
              <>
                <p className="mt-4 font-heading text-2xl font-bold uppercase text-tp-offwhite">{nextEvent.name}</p>
                <p className="mt-1 text-tp-offwhite/60">
                  {formatEventDateLong(nextEvent.event_date)} &middot; {tbc(nextEvent.location)}
                </p>
                <dl className="mt-4 space-y-1 text-sm text-tp-offwhite/60">
                  <div className="flex justify-between">
                    <dt>Tee Time</dt>
                    <dd>{tbc(nextEvent.first_tee_time ?? nextEvent.shotgun_time)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Format</dt>
                    <dd>{nextEvent.format ? FORMAT_LABELS[nextEvent.format as keyof typeof FORMAT_LABELS] : "TBC"}</dd>
                  </div>
                </dl>
                <div className="mt-6 flex gap-3">
                  <LinkButton href={`/events/${nextEvent.slug}`} variant="outline" size="sm">
                    Event Details
                  </LinkButton>
                  <LinkButton href={`/events/${nextEvent.slug}#enter`} variant="ghost" size="sm">
                    Withdraw
                  </LinkButton>
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 text-tp-offwhite/50">You&rsquo;re not entered into any upcoming events.</p>
                <LinkButton href="/tour-schedule" variant="gold" size="sm" className="mt-5">
                  View Tour Schedule
                </LinkButton>
              </>
            )}
          </div>

          <div className="border border-white/10 bg-tp-dark p-8">
            <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Quick Links</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/my-tp-tour/results" className="text-tp-offwhite/70 hover:text-tp-gold">
                  My Results &rarr;
                </Link>
              </li>
              <li>
                <Link href="/my-tp-tour/profile" className="text-tp-offwhite/70 hover:text-tp-gold">
                  My Profile &amp; Handicap &rarr;
                </Link>
              </li>
              <li>
                <Link href={`/players/${profile.id}`} className="text-tp-offwhite/70 hover:text-tp-gold">
                  View My Public Profile &rarr;
                </Link>
              </li>
              <li>
                <Link href="/order-of-merit" className="text-tp-offwhite/70 hover:text-tp-gold">
                  Order of Merit &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
