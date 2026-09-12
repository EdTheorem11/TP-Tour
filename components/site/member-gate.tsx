import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

export function MemberGate({ title, next }: { title: string; next: string }) {
  return (
    <section className="flex min-h-[60vh] items-center py-20">
      <Container className="max-w-md text-center">
        <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">{title}</h1>
        <p className="mt-4 text-tp-offwhite/60">This is available to TP Tour members.</p>
        <div className="mt-6 flex justify-center gap-3">
          <LinkButton href={`/login?next=${next}`} variant="outline">
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
