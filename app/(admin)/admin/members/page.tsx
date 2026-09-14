import Link from "next/link";
import { getAllMembersAdmin, getAllAuthActivity } from "@/lib/data/admin";
import { inputClass } from "@/components/admin/form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ShareLinkButtons } from "@/components/ui/share-link-buttons";
import { resendConfirmationEmailBulk, resendConfirmationEmailFromList } from "@/lib/actions/admin-members";
import { formatHandicap, formatDateTime, tbc } from "@/lib/format";
import type { MemberProfile } from "@/lib/types";

// The bulk resend below can loop over many members sequentially — give it
// more room than the platform default so it doesn't get killed mid-batch.
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";
const REGISTER_URL = `${SITE_URL}/register`;
const REGISTER_MESSAGE = `You've been invited to join TP Tour — the UAE's golf society for Finance & Crypto professionals. Click the link to register: ${REGISTER_URL}`;

const statusStyles: Record<string, string> = {
  pending: "text-tp-gold",
  approved: "text-tp-green-light",
  suspended: "text-red-400",
  rejected: "text-red-400",
};

function getSignupStats(members: MemberProfile[]) {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return [
    { label: "Total Members", value: members.length },
    { label: "Signed Up Today", value: members.filter((m) => new Date(m.created_at) >= startOfToday).length },
    { label: "Last 7 Days", value: members.filter((m) => now - new Date(m.created_at).getTime() <= 7 * DAY_MS).length },
    { label: "Last 30 Days", value: members.filter((m) => now - new Date(m.created_at).getTime() <= 30 * DAY_MS).length },
  ];
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; resent?: string; resendFailed?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const [members, allMembers, authActivity] = await Promise.all([
    getAllMembersAdmin(params.q),
    getAllMembersAdmin(),
    getAllAuthActivity(),
  ]);

  const signupStats = getSignupStats(allMembers);
  const unconfirmedCount = allMembers.filter((m) => !authActivity.get(m.id)?.email_confirmed_at).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Members</h1>
        <div className="flex flex-wrap gap-3">
          {unconfirmedCount > 0 && (
            <form action={resendConfirmationEmailBulk}>
              <ConfirmSubmitButton
                variant="outline"
                size="sm"
                confirmText={`Resend the confirmation email to all ${unconfirmedCount} unconfirmed member${unconfirmedCount === 1 ? "" : "s"}?`}
              >
                Resend to {unconfirmedCount} Unconfirmed
              </ConfirmSubmitButton>
            </form>
          )}
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80 hover:border-tp-gold hover:text-tp-gold [&::-webkit-details-marker]:hidden">
              + Add Member
            </summary>
            <div className="absolute right-0 z-10 mt-2 w-80 border border-white/15 bg-tp-dark p-5">
              <p className="text-xs text-tp-offwhite/50">
                Send this registration link to invite someone to join &mdash; they sign up and set their own
                password, no need to create an account for them.
              </p>
              <div className="mt-4">
                <ShareLinkButtons url={REGISTER_URL} message={REGISTER_MESSAGE} emailSubject="You're invited to join TP Tour" />
              </div>
            </div>
          </details>
          <a
            href="/api/admin/members/export"
            className="border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80 hover:border-tp-gold hover:text-tp-gold"
          >
            Download CSV
          </a>
        </div>
      </div>

      {params.resent !== undefined && (
        <div className="mt-6 border border-tp-green/40 bg-tp-green/10 px-5 py-3 text-sm text-tp-green-light">
          Resent confirmation email to {params.resent} member{params.resent === "1" ? "" : "s"}.
          {params.resendFailed && params.resendFailed !== "0" && (
            <span className="block text-tp-gold">Failed for {params.resendFailed} — check Supabase's auth rate limits if this keeps happening.</span>
          )}
        </div>
      )}
      {params.deleted && (
        <div className="mt-6 border border-tp-green/40 bg-tp-green/10 px-5 py-3 text-sm text-tp-green-light">
          Member deleted.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {signupStats.map((s) => (
          <div key={s.label} className="border border-white/10 bg-tp-dark p-5">
            <p className="font-heading text-2xl font-bold text-tp-gold">{s.value}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/50">{s.label}</p>
          </div>
        ))}
      </div>

      <form action="/admin/members" method="get" className="mt-6 max-w-sm">
        <input name="q" defaultValue={params.q} placeholder="Search members" className={inputClass} />
      </form>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">
              <th className="py-3 pr-4">Member</th>
              <th className="py-3 pr-4">Company</th>
              <th className="py-3 pr-4">Industry</th>
              <th className="py-3 pr-4">Hcp</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Email Confirmed</th>
              <th className="py-3 pr-4">Last Login</th>
              <th className="py-3 pr-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const activity = authActivity.get(m.id);
              return (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/members/${m.id}`} className="font-semibold text-tp-offwhite hover:text-tp-gold">
                      {m.first_name} {m.last_name}
                    </Link>
                    <p className="text-xs text-tp-offwhite/40">{m.email}</p>
                  </td>
                  <td className="py-3 pr-4 text-tp-offwhite/60">{tbc(m.company)}</td>
                  <td className="py-3 pr-4 text-tp-offwhite/60">{tbc(m.industry)}</td>
                  <td className="py-3 pr-4 text-tp-offwhite/60">{formatHandicap(m.current_handicap)}</td>
                  <td className={`py-3 pr-4 text-xs font-semibold uppercase tracking-[0.08em] ${statusStyles[m.status]}`}>
                    {m.status}
                  </td>
                  <td className="py-3 pr-4">
                    {activity?.email_confirmed_at ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-tp-green-light">Confirmed</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-red-400">Not Confirmed</span>
                        <form action={resendConfirmationEmailFromList.bind(null, m.id)}>
                          <button
                            type="submit"
                            className="border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-tp-offwhite/70 hover:border-tp-gold hover:text-tp-gold"
                          >
                            Resend
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-tp-offwhite/60">{formatDateTime(activity?.last_sign_in_at)}</td>
                  <td className="py-3 pr-4 text-tp-offwhite/40">{new Date(m.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {members.length === 0 && <p className="py-8 text-tp-offwhite/50">No members found.</p>}
      </div>
    </div>
  );
}
