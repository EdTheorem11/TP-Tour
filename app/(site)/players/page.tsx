import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/data/current-user";
import { getPlayerDirectory } from "@/lib/data/site";
import { formatHandicap, tbc } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Players",
  description: "The TP Tour players directory.",
};

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <section className="flex min-h-[60vh] items-center py-20">
        <Container className="max-w-md text-center">
          <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">TP Tour Players</h1>
          <p className="mt-4 text-tp-offwhite/60">The players directory is available to TP Tour members.</p>
          <div className="mt-6 flex justify-center gap-3">
            <LinkButton href="/login?next=/players" variant="outline">
              Login
            </LinkButton>
            <LinkButton href="/register" variant="gold">
              Join TP Tour
            </LinkButton>
          </div>
        </Container>
      </section>
    );
  }

  if (profile.status !== "approved") {
    return (
      <section className="flex min-h-[60vh] items-center py-20">
        <Container className="max-w-md text-center">
          <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Application Pending</h1>
          <p className="mt-4 text-tp-offwhite/60">
            The players directory unlocks once your membership has been approved.
          </p>
        </Container>
      </section>
    );
  }

  const players = await getPlayerDirectory(params.q);

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">Players</h1>

        <form className="mt-8 max-w-sm" action="/players" method="get">
          <input
            type="text"
            name="q"
            defaultValue={params.q}
            placeholder="Search by name, company or industry"
            className="w-full border border-white/15 bg-tp-dark px-4 py-3 text-sm text-tp-offwhite placeholder:text-tp-offwhite/30 focus:border-tp-gold focus:outline-none"
          />
        </form>

        {players.length === 0 ? (
          <p className="mt-16 text-center text-tp-offwhite/50">No players found.</p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <Link
                key={p.id}
                href={`/players/${p.id}`}
                className="border border-white/10 bg-tp-dark p-6 transition-colors hover:border-tp-gold/50"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tp-green/25 bg-cover bg-center font-heading text-lg font-bold text-tp-green-light"
                    style={p.avatar_url ? { backgroundImage: `url(${p.avatar_url})` } : undefined}
                  >
                    {!p.avatar_url && `${p.first_name[0]}${p.last_name[0]}`}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-heading font-bold uppercase text-tp-offwhite">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="truncate text-sm text-tp-offwhite/50">{tbc(p.company)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-tp-offwhite/50">
                  <span>Hcp {formatHandicap(p.current_handicap)}</span>
                  {p.tour_rank && <span>Rank #{p.tour_rank}</span>}
                  {p.industry && <span>{p.industry}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
