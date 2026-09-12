"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/tour-schedule", label: "Tour Schedule" },
  { href: "/order-of-merit", label: "Order of Merit" },
  { href: "/results", label: "Results" },
  { href: "/players", label: "Players" },
  { href: "/about", label: "About" },
  { href: "/partners", label: "Partners" },
];

export function Nav({
  isLoggedIn,
  firstName,
  avatarUrl,
}: {
  isLoggedIn: boolean;
  firstName?: string | null;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled || open ? "bg-tp-black/90 backdrop-blur-md border-b border-white/10" : "bg-transparent",
      )}
    >
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="TP Tour" width={800} height={150} className="h-8 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
                pathname === link.href ? "text-tp-gold" : "text-tp-offwhite/80 hover:text-tp-offwhite",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {isLoggedIn ? (
            <Link
              href="/my-tp-tour"
              className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-tp-offwhite hover:text-tp-gold"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-tp-green/30 bg-cover bg-center text-[11px] font-bold text-tp-green-light"
                style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
              >
                {!avatarUrl && (firstName?.[0]?.toUpperCase() ?? "M")}
              </span>
              My TP Tour
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold uppercase tracking-[0.12em] text-tp-offwhite/80 hover:text-tp-offwhite"
              >
                Login
              </Link>
              <LinkButton href="/register" variant="gold" size="sm">
                Join the Tour
              </LinkButton>
            </>
          )}
        </div>

        <button
          className="text-tp-offwhite lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-white/10 bg-tp-black lg:hidden">
          <Container className="flex flex-col gap-1 py-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "py-3 text-sm font-semibold uppercase tracking-[0.12em]",
                  pathname === link.href ? "text-tp-gold" : "text-tp-offwhite/80",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
              {isLoggedIn ? (
                <LinkButton href="/my-tp-tour" variant="gold">
                  My TP Tour
                </LinkButton>
              ) : (
                <>
                  <LinkButton href="/login" variant="outline">
                    Login
                  </LinkButton>
                  <LinkButton href="/register" variant="gold">
                    Join the Tour
                  </LinkButton>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
