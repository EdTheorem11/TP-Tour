import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { HeroBackground } from "@/components/site/hero-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "TP Tour was created to bring together professionals across Finance, Crypto, Digital Assets and FinTech through competitive golf in the UAE.",
};

export default function AboutPage() {
  return (
    <>
      <HeroBackground src="/about-hero.png" alt="TP Tour members networking on the course">
        <Container className="max-w-3xl py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">About TP Tour</p>
          <h1 className="mt-4 font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-6xl">
            The Networking Happens Naturally.
          </h1>
          <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-tp-offwhite/70">
            TP Tour was created to bring together people working across Finance, Crypto, Digital Assets and FinTech
            in the UAE through a shared love of golf.
          </p>
          <p className="mt-4 max-w-xl text-balance text-lg leading-relaxed text-tp-offwhite/70">
            No awkward networking events. No forced introductions. Just great golf, great courses and good people.
          </p>
        </Container>
      </HeroBackground>

      <section className="py-20 lg:py-28">
        <Container>
          <p className="text-center font-heading text-2xl font-bold uppercase tracking-wide text-tp-gold sm:text-3xl">
            Play. Compete. Connect.
          </p>
        </Container>
      </section>

      <section className="border-t border-white/10 bg-tp-dark py-20 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">The TP Tour Difference</p>
            <h2 className="mt-4 font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-5xl">
              Your Network. On the Course.
            </h2>
            <p className="mt-5 text-lg font-semibold text-tp-offwhite">
              Build relationships without the boardroom.
            </p>
          </div>
          <div>
            <p className="text-balance text-lg leading-relaxed text-tp-offwhite/70">
              Join industry leaders, founders, investors, traders and professionals from across the UAE&rsquo;s
              Finance, Crypto and Digital Asset community.
            </p>
            <p className="mt-4 text-balance text-lg leading-relaxed text-tp-offwhite/70">
              No name badges. No forced networking. Just 18 holes, good company and plenty of time to get to know
              the people shaping the industry.
            </p>
            <div className="mt-8">
              <LinkButton href="/register" variant="gold">
                Join the Network
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container>
          <div className="text-center">
            <h2 className="font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-5xl">
              More Than a Golf Society.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-tp-offwhite/70">
              Golf brings us together. The community is what makes TP Tour different. Whether you&rsquo;re looking
              to expand your network, meet others in the industry, find your next business opportunity or simply
              play more golf with a great group of people &mdash; TP Tour puts you in the right fourball.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              { title: "Play", body: "Regular events at leading courses across the UAE." },
              { title: "Connect", body: "Meet professionals from across Finance, Crypto, Digital Assets and FinTech." },
              { title: "Compete", body: "Every round matters. Earn points, climb the Order of Merit and compete to become TP Tour Champion." },
            ].map((pillar) => (
              <div key={pillar.title} className="bg-tp-dark px-8 py-10 text-center">
                <p className="font-heading text-xl font-bold uppercase text-tp-gold">{pillar.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-tp-offwhite/60">{pillar.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-white/10 bg-tp-dark py-20 text-center lg:py-28">
        <Container className="max-w-2xl">
          <h2 className="font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-5xl">
            Find Your Fourball.
          </h2>
          <p className="mt-5 text-balance text-lg leading-relaxed text-tp-offwhite/70">
            New to the UAE? Looking to expand your circle? Want to meet more people in the industry? You don&rsquo;t
            need to know anyone before you join. That&rsquo;s the point. Sign up, enter an event and we&rsquo;ll see
            you on the first tee.
          </p>
          <div className="mt-8">
            <LinkButton href="/register" variant="gold" size="lg">
              Join TP Tour
            </LinkButton>
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container className="max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold uppercase text-tp-offwhite sm:text-4xl">
            4 Hours Beats a Coffee.
          </h2>
          <p className="mt-6 text-balance text-lg leading-relaxed text-tp-offwhite/70">
            Some of the best relationships aren&rsquo;t built across a meeting-room table.
          </p>
          <p className="mt-3 text-balance text-lg leading-relaxed text-tp-offwhite/70">
            They&rsquo;re built walking fairways, waiting on tee boxes and sharing a drink after 18.
          </p>
          <p className="mt-3 text-balance text-lg leading-relaxed text-tp-offwhite/70">
            TP Tour brings the UAE&rsquo;s Finance &amp; Crypto community together in an environment where
            conversations happen naturally.
          </p>
          <p className="mt-10 text-balance font-heading text-2xl font-bold uppercase leading-snug text-tp-gold sm:text-3xl">
            Your next client, partner, investor, employer or friend could be in your next fourball.
          </p>
        </Container>
      </section>

      <section className="border-t border-white/10 bg-tp-dark py-20 text-center lg:py-24">
        <Container>
          <h2 className="font-heading text-3xl font-bold uppercase text-tp-offwhite sm:text-4xl">
            Ready to Join the Tour?
          </h2>
          <div className="mt-8">
            <LinkButton href="/register" variant="gold" size="lg">
              Join TP Tour
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}
