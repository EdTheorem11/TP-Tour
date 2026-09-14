import { notFound } from "next/navigation";
import { getMemberAdmin, getMemberHandicapHistory, getAuthActivity } from "@/lib/data/admin";
import { getCurrentProfile } from "@/lib/data/current-user";
import { Field, inputClass } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AutoToast } from "@/components/admin/auto-toast";
import {
  approveMember,
  suspendMember,
  rejectMember,
  updateMemberRole,
  adminAdjustHandicap,
  approveHandicapChange,
  updateMemberDetailsAdmin,
  resendConfirmationEmailAdmin,
  deleteMember,
} from "@/lib/actions/admin-members";
import { formatHandicap, formatDateTime, tbc } from "@/lib/format";
import { INDUSTRY_OPTIONS } from "@/lib/types";

export default async function AdminMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resendSuccess?: string; resendError?: string; deleteError?: string }>;
}) {
  const { id } = await params;
  const { resendSuccess, resendError, deleteError } = await searchParams;
  const member = await getMemberAdmin(id);
  if (!member) notFound();
  const currentAdmin = await getCurrentProfile();
  const isSuperAdmin = currentAdmin?.role === "super_admin";
  const authActivity = await getAuthActivity(id);

  const history = await getMemberHandicapHistory(id) as Array<{
    id: string;
    old_handicap: number | null;
    new_handicap: number;
    status: string;
    source: string;
    reason: string | null;
    created_at: string;
  }>;
  const pendingChanges = history.filter((h) => h.status === "pending");

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">
            {member.first_name} {member.last_name}
          </h1>
          <p className="text-sm text-tp-offwhite/50">{member.email}</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-tp-gold">{member.status}</span>
      </div>

      {resendSuccess && <AutoToast message="Confirmation email sent." variant="success" cleanHref={`/admin/members/${id}`} />}
      {resendError && (
        <AutoToast message={`Couldn't send the confirmation email: ${resendError}`} variant="error" cleanHref={`/admin/members/${id}`} />
      )}
      {deleteError && (
        <AutoToast message={`Couldn't delete this member: ${deleteError}`} variant="error" cleanHref={`/admin/members/${id}`} />
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <form action={approveMember.bind(null, id)}>
          <Button type="submit" variant="gold" size="sm">Approve</Button>
        </form>
        <form action={suspendMember.bind(null, id)}>
          <Button type="submit" variant="outline" size="sm">Suspend</Button>
        </form>
        <form action={rejectMember.bind(null, id)}>
          <Button type="submit" variant="outline" size="sm">Reject</Button>
        </form>
      </div>

      <div className="mt-10 border-t border-white/10 pt-8">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">Email Confirmed</dt>
            <dd className="mt-1">
              {authActivity?.email_confirmed_at ? (
                <span className="text-sm font-semibold text-tp-green-light">
                  Confirmed &middot; {formatDateTime(authActivity.email_confirmed_at)}
                </span>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-red-400">Not Confirmed</span>
                  <form action={resendConfirmationEmailAdmin.bind(null, id)}>
                    <button type="submit" className="text-xs text-tp-gold hover:underline">
                      Resend Confirmation Email
                    </button>
                  </form>
                </div>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">Last Login</dt>
            <dd className="mt-1 text-sm text-tp-offwhite">{formatDateTime(authActivity?.last_sign_in_at)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-10 border-t border-white/10 pt-8">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Role</h2>
        <form
          action={async (fd: FormData) => {
            "use server";
            await updateMemberRole(id, fd.get("role") as "member" | "admin" | "super_admin");
          }}
          className="mt-4 flex gap-3"
        >
          <select name="role" defaultValue={member.role} className={inputClass + " max-w-xs"}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <Button type="submit" variant="outline" size="sm">Update Role</Button>
        </form>
      </div>

      <div className="mt-10 border-t border-white/10 pt-8">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Details</h2>
        <form action={updateMemberDetailsAdmin.bind(null, id)} className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="First Name"><input name="first_name" defaultValue={member.first_name} className={inputClass} /></Field>
          <Field label="Last Name"><input name="last_name" defaultValue={member.last_name} className={inputClass} /></Field>
          <Field label="Mobile"><input name="mobile" defaultValue={member.mobile ?? ""} className={inputClass} /></Field>
          <Field label="Nationality"><input name="nationality" defaultValue={member.nationality ?? ""} className={inputClass} /></Field>
          <Field label="Company"><input name="company" defaultValue={member.company ?? ""} className={inputClass} /></Field>
          <Field label="Job Title"><input name="job_title" defaultValue={member.job_title ?? ""} className={inputClass} /></Field>
          <Field label="Industry">
            <select name="industry" defaultValue={member.industry ?? ""} className={inputClass}>
              <option value="">Select industry</option>
              {INDUSTRY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </Field>
          <Field label="Golf Club"><input name="home_golf_club" defaultValue={member.home_golf_club ?? ""} className={inputClass} /></Field>
          <Field label="Home Course"><input name="home_course" defaultValue={member.home_course ?? ""} className={inputClass} /></Field>
          <Field label="EGF / WHS Number"><input name="egf_whs_number" defaultValue={member.egf_whs_number ?? ""} className={inputClass} /></Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="gold" size="sm">Save Details</Button>
          </div>
        </form>
      </div>

      <div className="mt-10 border-t border-white/10 pt-8">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Handicap</h2>
        <p className="mt-2 text-sm text-tp-offwhite/60">
          Current: <span className="text-tp-offwhite">{formatHandicap(member.current_handicap)}</span>
        </p>

        {isSuperAdmin ? (
          <form
            action={async (fd: FormData) => {
              "use server";
              await adminAdjustHandicap(id, Number(fd.get("new_handicap")), String(fd.get("reason") ?? ""));
            }}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <Field label="New Handicap">
              <input type="number" step="0.1" name="new_handicap" required className={inputClass + " w-32"} />
            </Field>
            <Field label="Reason">
              <input name="reason" className={inputClass} />
            </Field>
            <Button type="submit" variant="outline" size="sm">Adjust Handicap</Button>
          </form>
        ) : (
          <p className="mt-3 text-xs text-tp-offwhite/40">Only a super admin can adjust a member&rsquo;s handicap.</p>
        )}

        {pendingChanges.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-tp-gold">Pending Approval</p>
            <ul className="mt-3 space-y-2">
              {pendingChanges.map((h) => (
                <li key={h.id} className="flex items-center justify-between border border-white/10 bg-tp-dark px-4 py-2.5 text-sm">
                  <span>{formatHandicap(h.old_handicap)} &rarr; {formatHandicap(h.new_handicap)} &middot; {tbc(h.reason)}</span>
                  {isSuperAdmin ? (
                    <form action={approveHandicapChange.bind(null, id, h.id)}>
                      <button className="text-xs text-tp-green-light hover:underline">Approve</button>
                    </form>
                  ) : (
                    <span className="text-xs uppercase tracking-[0.1em] text-tp-offwhite/30">Super admin only</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">History</p>
          <ul className="mt-3 space-y-1 text-sm text-tp-offwhite/60">
            {history.map((h) => (
              <li key={h.id}>
                {new Date(h.created_at).toLocaleDateString("en-GB")}: {formatHandicap(h.old_handicap)} &rarr; {formatHandicap(h.new_handicap)}
                {" "}({h.source}, {h.status})
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="mt-10 border-t border-red-500/20 pt-8">
          <h2 className="font-heading text-lg font-bold uppercase text-red-400">Danger Zone</h2>
          <p className="mt-2 text-sm text-tp-offwhite/50">
            Permanently deletes this member&rsquo;s account, profile and all their tour history (entries, scores,
            handicap history). This cannot be undone.
          </p>
          <form action={deleteMember.bind(null, id)} className="mt-4">
            <ConfirmSubmitButton
              variant="danger"
              size="sm"
              confirmText={`Are you sure you want to delete "${member.first_name} ${member.last_name}" from the TP Tour?`}
            >
              Delete Member
            </ConfirmSubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
