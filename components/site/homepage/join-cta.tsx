import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

export function JoinCta() {
  return (
    <section className="relative overflow-hidden bg-tp-green py-24 text-center lg:py-32">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(195,164,109,0.25), transparent 60%)",
        }}
      />
      <Container className="relative z-10">
        <h2 className="font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-5xl">
          Ready to Join the Tour?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-tp-offwhite/80">
          Join one of the UAE&rsquo;s fastest-growing golf communities for Finance &amp; Crypto professionals.
        </p>
        <div className="mt-9">
          <LinkButton href="/register" variant="gold" size="lg">
            Join TP Tour
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
