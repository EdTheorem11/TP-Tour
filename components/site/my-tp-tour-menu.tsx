"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { logoutMember } from "@/lib/actions/auth";

export function MyTpTourMenu({
  firstName,
  avatarUrl,
  memberId,
  isAdmin,
}: {
  firstName?: string | null;
  avatarUrl?: string | null;
  memberId?: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items = [
    { href: "/my-tp-tour", label: "Dashboard" },
    { href: "/my-tp-tour/results", label: "My Results" },
    { href: "/my-tp-tour/profile", label: "My Profile & Handicap" },
    ...(memberId ? [{ href: `/players/${memberId}`, label: "View My Public Profile" }] : []),
    { href: "/order-of-merit", label: "Order of Merit" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel" }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-tp-offwhite hover:text-tp-gold"
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full bg-tp-green/30 bg-cover bg-center text-[11px] font-bold text-tp-green-light"
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        >
          {!avatarUrl && (firstName?.[0]?.toUpperCase() ?? "M")}
        </span>
        My TP Tour
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-64 border border-white/10 bg-tp-dark py-2 shadow-xl">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80 hover:bg-white/5 hover:text-tp-gold"
            >
              {item.label}
            </Link>
          ))}
          <form action={logoutMember} className="border-t border-white/10 mt-2 pt-2">
            <button className="block w-full px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.1em] text-red-400 hover:bg-white/5">
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
