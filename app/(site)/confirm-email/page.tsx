import { Container } from "@/components/ui/container";
import { ConfirmEmail } from "@/components/site/confirm-email";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Email Confirmed" };

export default function ConfirmEmailPage() {
  return (
    <section className="flex min-h-[80vh] items-center py-20">
      <Container className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite">Almost There</h1>
        <ConfirmEmail />
      </Container>
    </section>
  );
}
