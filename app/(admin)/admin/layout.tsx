import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentProfile } from "@/lib/data/current-user";
import { getPendingMembers, getPendingHandicapChanges } from "@/lib/data/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/entries", label: "Entries" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/scoring", label: "Scoring" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/order-of-merit", label: "Order of Merit" },
  { href: "/admin/golf-clubs", label: "Golf Clubs" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const previewMode = !isSupabaseConfigured();

  if (!previewMode) {
    const profile = await getCurrentProfile();
    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      redirect("/");
    }
  }

  const [pendingMembers, pendingHandicaps] = previewMode
    ? [[], []]
    : await Promise.all([getPendingMembers(), getPendingHandicapChanges()]);
  const pendingCount = pendingMembers.length + pendingHandicaps.length;

  return (
    <div className="flex min-h-screen bg-tp-black text-tp-offwhite print:block print:bg-white print:text-black">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-tp-dark p-6 lg:block print:hidden">
        <Link href="/">
          <Image src="/logo.png" alt="TP Tour" width={800} height={150} className="h-7 w-auto" />
        </Link>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">Admin Panel</p>

        <nav className="mt-10 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-tp-offwhite/70 transition-colors hover:bg-white/5 hover:text-tp-offwhite"
            >
              {item.label}
              {item.href === "/admin/approvals" && pendingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-tp-green px-1.5 text-[11px] font-bold text-tp-offwhite">
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <Link href="/" className="mt-10 block text-xs text-tp-offwhite/40 hover:text-tp-offwhite">
          &larr; Back to Site
        </Link>
      </aside>

      <div className="flex-1 print:w-full">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 lg:hidden print:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="TP Tour" width={800} height={150} className="h-6 w-auto" />
            <span className="text-sm font-semibold uppercase tracking-[0.1em] text-tp-offwhite/60">Admin</span>
          </Link>
          <Link href="/admin/approvals" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/70">
            Approvals
            {pendingCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-tp-green px-1.5 text-[11px] font-bold text-tp-offwhite">
                {pendingCount}
              </span>
            )}
          </Link>
        </header>
        {previewMode && (
          <div className="border-b border-tp-gold/30 bg-tp-gold/10 px-6 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.1em] text-tp-gold print:hidden">
            Preview Mode &mdash; no Supabase project connected, showing empty data with no login required
          </div>
        )}
        <main className="p-6 lg:p-10 print:p-0">{children}</main>
      </div>
    </div>
  );
}
