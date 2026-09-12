"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { MyTpTourMenu } from "@/components/site/my-tp-tour-menu";
import { logoutMember } from "@/lib/actions/auth";

function getLinks(isLoggedIn: boolean) {
  if (isLoggedIn) {
    return [
      { href: "/tour-schedule", label: "Tour Schedule" },
      { href: "/order-of-merit", label: "Order of Merit" },
      { href: "/results", label: "Results" },
      { href: "/players", label: "Players" },
      { href: "/about", label: "About" },
    ];
  }
  return [
    { href: "/tour-schedule", label: "Sign Up to Join" },
    { href: "/about", label: "About" },
  ];
}

export function Nav({
  isLoggedIn,
  firstName,
  avatarUrl,
  memberId,
  isAdmin,
}: {
  isLoggedIn: boolean;
  firstName?: string | null;
  avatarUrl?: string | null;
  memberId?: string;
  isAdmin?: boolean;
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

  const links = getLinks(isLoggedIn);
  const isHome = pathname === "/";

  return (
    <header
      className={clsx(
        "z-50 transition-colors duration-300",
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
        scrolled || open ? "bg-tp-black/90 backdrop-blur-md border-b border-white/10" : "bg-transparent",
      )}
    >
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="TP Tour" width={800} height={150} className="h-8 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
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
            <MyTpTourMenu firstName={firstName} avatarUrl={avatarUrl} memberId={memberId} isAdmin={!!isAdmin} />
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
            <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4">
              {isLoggedIn ? (
                <>
                  <p className="py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">
                    My TP Tour
                  </p>
                  <Link href="/my-tp-tour" className="py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80">
                    Dashboard
                  </Link>
                  <Link href="/my-tp-tour/results" className="py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80">
                    My Results
                  </Link>
                  <Link href="/my-tp-tour/profile" className="py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80">
                    My Profile &amp; Handicap
                  </Link>
                  {memberId && (
                    <Link href={`/players/${memberId}`} className="py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80">
                      View My Public Profile
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin" className="py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-tp-gold">
                      Admin Panel
                    </Link>
                  )}
                  <form action={logoutMember} className="mt-2 border-t border-white/10 pt-3">
                    <button className="py-2.5 text-left text-sm font-semibold uppercase tracking-[0.1em] text-red-400">
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <LinkButton href="/login" variant="outline">
                    Login
                  </LinkButton>
                  <LinkButton href="/register" variant="gold">
                    Join the Tour
                  </LinkButton>
                </div>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
