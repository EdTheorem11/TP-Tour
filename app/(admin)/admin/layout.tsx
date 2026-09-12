import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/data/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const navItems = [
  { href: "/admin", label: "Dashboard" },
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

  return (
    <div className="flex min-h-screen bg-tp-black text-tp-offwhite">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-tp-dark p-6 lg:block">
        <Link href="/" className="font-heading text-lg font-bold tracking-[0.15em]">
          TP <span className="text-tp-gold">TOUR</span>
        </Link>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-tp-offwhite/40">Admin Panel</p>

        <nav className="mt-10 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 text-sm font-medium text-tp-offwhite/70 transition-colors hover:bg-white/5 hover:text-tp-offwhite"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/" className="mt-10 block text-xs text-tp-offwhite/40 hover:text-tp-offwhite">
          &larr; Back to Site
        </Link>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 lg:hidden">
          <Link href="/" className="font-heading text-lg font-bold tracking-[0.15em]">
            TP <span className="text-tp-gold">TOUR</span> Admin
          </Link>
        </header>
        {previewMode && (
          <div className="border-b border-tp-gold/30 bg-tp-gold/10 px-6 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.1em] text-tp-gold">
            Preview Mode &mdash; no Supabase project connected, showing empty data with no login required
          </div>
        )}
        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
