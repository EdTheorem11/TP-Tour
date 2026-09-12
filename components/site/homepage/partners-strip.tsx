import Image from "next/image";
import { Container } from "@/components/ui/container";
import type { Partner } from "@/lib/types";

export function PartnersStrip({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  const titlePartner = partners.find((p) => p.sponsor_level === "title_partner");
  const others = partners.filter((p) => p.sponsor_level !== "title_partner");

  return (
    <section className="border-y border-white/10 py-16">
      <Container>
        {titlePartner && (
          <div className="mb-12 flex flex-col items-center text-center">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Title Partner</p>
            <div className="flex items-center justify-center rounded-sm bg-tp-offwhite px-10 py-6">
              {titlePartner.logo_url ? (
                <Image
                  src={titlePartner.logo_url}
                  alt={titlePartner.name}
                  width={220}
                  height={80}
                  className="h-14 w-auto object-contain"
                />
              ) : (
                <span className="font-heading text-2xl font-bold text-tp-black">{titlePartner.name}</span>
              )}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <>
            <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.35em] text-tp-offwhite/40">
              Tour Partners
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {others.map((partner) => (
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
      </Container>
    </section>
  );
}
