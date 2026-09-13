import { getAllEventsAdmin } from "@/lib/data/admin";
import { Field, inputClass } from "@/components/admin/form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { sendAnnouncement } from "@/lib/actions/admin-announcements";

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; failed?: string; error?: string }>;
}) {
  const { sent, failed, error } = await searchParams;
  const events = await getAllEventsAdmin();

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Announcements</h1>
      <p className="mt-2 text-sm text-tp-offwhite/50">
        Send an email to all approved members, or everyone entered into a specific event &mdash; useful for a course
        change, weather cancellation, or general update, without touching the schedule itself.
      </p>

      {sent !== undefined && (
        <div className="mt-6 border border-tp-green/40 bg-tp-green/10 px-5 py-3 text-sm text-tp-green-light">
          Sent to {sent} recipient{sent === "1" ? "" : "s"}.
          {failed && Number(failed) > 0 && (
            <span className="block text-tp-gold">{failed} failed to send &mdash; check RESEND_API_KEY / logs.</span>
          )}
        </div>
      )}
      {error && (
        <div className="mt-6 border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm text-red-400">{error}</div>
      )}

      <form action={sendAnnouncement} className="mt-8 max-w-2xl space-y-5">
        <Field label="Send To">
          <select name="audience" required defaultValue="all_approved" className={inputClass}>
            <option value="all_approved">All Approved Members</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                Entrants: {e.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subject">
          <input name="subject" required className={inputClass} />
        </Field>
        <Field label="Message">
          <textarea name="message" required rows={8} className={inputClass} />
        </Field>
        <ConfirmSubmitButton confirmText="Send this announcement now? This can't be undone.">
          Send Announcement
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
