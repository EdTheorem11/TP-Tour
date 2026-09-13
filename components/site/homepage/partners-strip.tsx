import Image from "next/image";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import type { Partner } from "@/lib/types";

const PARTNER_EMAIL = "Ed@theorem-partners.com";
const PARTNER_MAILTO = `mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent("TP Tour Partnership Enquiry")}`;

export function PartnersStrip({ partners }: { partners: Partner[] }) {
  return (
    <section className="border-y border-white/10 py-16">
      <Container>
        {partners.length > 0 && (
          <>
            <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.35em] text-tp-offwhite/40">
              Tour Partners
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-center rounded-sm bg-tp-offwhite px-6 py-4"
                >
                  {partner.logo_url ? (
                    <Image
                      src={partner.logo_url}
                      alt={partner.name}
                      width={140}
                      height={56}
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <span className="font-heading text-sm font-semibold text-tp-black">{partner.name}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-12 text-center">
          <LinkButton href={PARTNER_MAILTO} variant="outline" size="sm">
            Become a Partner
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
