import Image from "next/image";
import { Container } from "@/components/ui/container";
import type { Partner } from "@/lib/types";

export function PartnersStrip({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  return (
    <section className="border-y border-white/10 py-16">
      <Container>
        <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.35em] text-tp-offwhite/40">
          Tour Partners
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {partners.map((partner) =>
            partner.logo_url ? (
              <Image
                key={partner.id}
                src={partner.logo_url}
                alt={partner.name}
                width={140}
                height={56}
                className="h-10 w-auto object-contain opacity-70 grayscale transition-opacity hover:opacity-100 hover:grayscale-0"
              />
            ) : (
              <span key={partner.id} className="text-lg font-heading font-semibold text-tp-offwhite/50">
                {partner.name}
              </span>
            ),
          )}
        </div>
      </Container>
    </section>
  );
}
