import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

export default function RegisterSuccessPage() {
  return (
    <section className="flex min-h-[70vh] items-center py-24">
      <Container className="max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Welcome to TP Tour</p>
        <h1 className="mt-4 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">
          You&rsquo;re In
        </h1>
        <p className="mt-5 text-tp-offwhite/60">
          Thanks for joining TP Tour. Check your email to confirm your account, then you&rsquo;re ready to enter
          events and connect with other members.
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
