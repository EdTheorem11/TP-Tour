import Link from "next/link";
import type { MemberProfile } from "@/lib/types";

const items: { key: keyof MemberProfile; label: string }[] = [
  { key: "avatar_url", label: "Add a profile photo" },
  { key: "current_handicap", label: "Add your handicap" },
  { key: "home_golf_club", label: "Add your home golf club" },
  { key: "mobile", label: "Add your mobile number" },
];

export function OnboardingChecklist({ profile }: { profile: MemberProfile }) {
  const missing = items.filter((item) => !profile[item.key]);
  if (missing.length === 0) return null;

  return (
    <div className="border border-tp-gold/30 bg-tp-dark p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-tp-gold">Finish Setting Up Your Profile</p>
      <p className="mt-2 text-sm text-tp-offwhite/60">
        A few details are missing — filling these in helps other members recognise you and keeps your handicap
        accurate for events.
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {missing.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-sm text-tp-offwhite/80">
            <span className="h-1.5 w-1.5 rounded-full bg-tp-gold" />
            {item.label}
          </li>
        ))}
      </ul>
      <Link
        href="/my-tp-tour/profile"
        className="mt-5 inline-block text-xs font-semibold uppercase tracking-[0.1em] text-tp-gold hover:underline"
      >
        Complete Profile &rarr;
      </Link>
    </div>
  );
}
