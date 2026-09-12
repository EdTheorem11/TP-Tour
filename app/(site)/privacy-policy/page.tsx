import { Container } from "@/components/ui/container";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <section className="py-20 lg:py-28">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-4xl font-bold uppercase text-tp-offwhite">Privacy Policy</h1>
        <p className="mt-6 text-tp-offwhite/60">
          This page will hold TP Tour&rsquo;s full privacy policy, covering how member data (profile details,
          handicaps, event entries and payment status) is collected, stored and used. Content to be finalised by
          TP Tour and published here from the admin content panel.
        </p>
      </Container>
    </section>
  );
}
