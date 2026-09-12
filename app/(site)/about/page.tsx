import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "TP Tour was created to bring together professionals across Finance, Crypto, Digital Assets and FinTech through competitive golf in the UAE.",
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-white/10 py-24 lg:py-32">
        <Container className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">About TP Tour</p>
          <h1 className="mt-4 font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-6xl">
            The Networking Happens Naturally.
          </h1>
          <p className="mt-6 text-balance text-lg leading-relaxed text-tp-offwhite/70">
            TP Tour was created to bring together people working across Finance, Crypto, Digital Assets and FinTech
            in the UAE through a shared love of golf.
          </p>
          <p className="mt-4 text-balance text-lg leading-relaxed text-tp-offwhite/70">
            No awkward networking events. No forced introductions. Just great golf, great courses and good people.
          </p>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container>
          <p className="text-center font-heading text-2xl font-bold uppercase tracking-wide text-tp-gold sm:text-3xl">
            Play. Compete. Connect.
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
