import { Container } from "@/components/ui/container";
import { getPartners } from "@/lib/data/site";
import { SPONSOR_LEVEL_LABELS, type SponsorLevel } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partners",
  description: "The brands and organisations partnering with TP Tour.",
};

const levelOrder: SponsorLevel[] = ["title_partner", "official_partner", "tour_partner", "event_partner", "prize_partner"];

export default async function PartnersPage() {
  const partners = await getPartners();

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">Partners</h1>

        {partners.length === 0 ? (
          <p className="mt-16 text-center text-tp-offwhite/50">Partner announcements coming soon.</p>
        ) : (
          <div className="mt-14 space-y-14">
            {levelOrder.map((level) => {
              const group = partners.filter((p) => p.sponsor_level === level);
              if (group.length === 0) return null;
              return (
                <div key={level}>
                  <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-tp-offwhite/40">
                    {SPONSOR_LEVEL_LABELS[level]}
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((p) => (
                      <a
                        key={p.id}
                        href={p.website ?? undefined}
                        target={p.website ? "_blank" : undefined}
                        rel="noreferrer"
                        className="border border-white/10 bg-tp-dark p-6 transition-colors hover:border-tp-gold/50"
                      >
                        <p className="font-heading text-lg font-bold uppercase text-tp-offwhite">{p.name}</p>
                        {p.description && <p className="mt-2 text-sm text-tp-offwhite/60">{p.description}</p>}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
