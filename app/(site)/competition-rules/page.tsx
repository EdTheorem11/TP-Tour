import { Container } from "@/components/ui/container";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Competition Rules" };

export default function CompetitionRulesPage() {
  return (
    <section className="py-20 lg:py-28">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-4xl font-bold uppercase text-tp-offwhite">Competition Rules</h1>
        <p className="mt-6 text-tp-offwhite/60">
          General TP Tour competition rules and cancellation policy. Event-specific rules are shown on each event
          page. Content to be finalised by TP Tour and published here from the admin content panel.
        </p>
      </Container>
    </section>
  );
}
