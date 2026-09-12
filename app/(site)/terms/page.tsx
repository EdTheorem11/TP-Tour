import { Container } from "@/components/ui/container";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <section className="py-20 lg:py-28">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-4xl font-bold uppercase text-tp-offwhite">Terms</h1>
        <p className="mt-6 text-tp-offwhite/60">
          This page will hold TP Tour&rsquo;s membership terms and conditions. Content to be finalised by TP Tour
          and published here from the admin content panel.
        </p>
      </Container>
    </section>
  );
}
