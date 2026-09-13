import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

interface AboutCopy {
  headline?: string;
  body?: string;
}

interface Stats {
  members?: string;
  tour_champions?: string;
}

export function AboutStats({
  about,
  stats,
  eventsCount,
  coursesCount,
}: {
  about: AboutCopy | null;
  stats: Stats | null;
  eventsCount: number;
  coursesCount: number;
}) {
  const items = [
    { value: stats?.members ?? "280+", label: "Members" },
    { value: String(eventsCount), label: "Tour Events" },
    { value: String(coursesCount), label: "Premium Courses" },
    { value: stats?.tour_champions ?? "1", label: "Tour Champion" },
  ];

  return (
    <section className="py-20 lg:py-28">
      <Container className="grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-5xl">
            {about?.headline ?? "More Than Just Golf."}
          </h2>
          <p className="mt-6 max-w-lg text-balance text-lg leading-relaxed text-tp-offwhite/60">
            {about?.body ??
              "TP Tour brings together professionals from Finance, Crypto, Digital Assets and FinTech through competitive golf at some of the UAE's best courses."}
          </p>
          <div className="mt-8">
            <LinkButton href="/about" variant="outline" size="sm">
              About TP Tour
            </LinkButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10">
          {items.map((item) => (
            <div key={item.label} className="bg-tp-dark px-8 py-10 text-center">
              <p className="font-heading text-4xl font-bold text-tp-gold sm:text-5xl">{item.value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-tp-offwhite/50">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
