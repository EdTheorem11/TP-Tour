import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

export default function RegisterSuccessPage() {
  return (
    <section className="flex min-h-[70vh] items-center py-24">
      <Container className="max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Welcome to TP Tour</p>
        <h1 className="mt-4 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">
          Application Received
        </h1>
        <p className="mt-5 text-tp-offwhite/60">
          Thanks for applying to join TP Tour. Your membership is being reviewed &mdash; we&rsquo;ll email you as
          soon as your account is approved and you can enter events.
        </p>
        <div className="mt-8">
          <LinkButton href="/" variant="outline">
            Back to Home
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
