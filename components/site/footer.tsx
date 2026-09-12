import Link from "next/link";
import { Container } from "@/components/ui/container";

const nav = [
  { href: "/tour-schedule", label: "Tour Schedule" },
  { href: "/order-of-merit", label: "Order of Merit" },
  { href: "/results", label: "Results" },
  { href: "/players", label: "Players" },
  { href: "/about", label: "About" },
  { href: "/partners", label: "Partners" },
  { href: "/register", label: "Join" },
];

const legal = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/competition-rules", label: "Competition Rules" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-tp-dark">
      <Container className="grid gap-12 py-16 lg:grid-cols-4">
        <div>
          <div className="font-heading text-xl font-bold tracking-[0.15em]">
            TP <span className="text-tp-gold">TOUR</span>
          </div>
          <p className="mt-3 text-sm font-medium uppercase tracking-[0.12em] text-tp-offwhite/50">
            Golf. Network. Compete.
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-tp-offwhite/60">
            The UAE&rsquo;s Golf Society for Finance &amp; Crypto Professionals.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
            Navigate
          </h4>
          <ul className="space-y-2.5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-tp-offwhite/70 hover:text-tp-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
            Legal
          </h4>
          <ul className="space-y-2.5">
            {legal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-tp-offwhite/70 hover:text-tp-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
            Connect
          </h4>
          <ul className="space-y-2.5">
            <li>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-tp-offwhite/70 hover:text-tp-gold"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-tp-offwhite/70 hover:text-tp-gold"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10 py-6">
        <Container className="flex flex-col gap-2 text-xs text-tp-offwhite/40 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; TP Tour {new Date().getFullYear()}</span>
          <span>Dubai &middot; United Arab Emirates</span>
        </Container>
      </div>
    </footer>
  );
}
