"use client";

import { useState, useTransition } from "react";
import { sendEventThankYouEmails } from "@/lib/actions/admin-events";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/admin/toast";
import { formatDateTime } from "@/lib/format";

export function SendThankYouButton({
  eventId,
  alreadySentAt,
  total,
  remaining,
}: {
  eventId: string;
  alreadySentAt: string | null;
  total: number;
  remaining: number;
}) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const sentCount = total - remaining;
  const partial = sentCount > 0 && remaining > 0;
  const allSent = total > 0 && remaining === 0;

  const run = (mode: "unsent" | "all", confirmMessage: string) => {
    if (!window.confirm(confirmMessage)) return;

    startTransition(async () => {
      const result = await sendEventThankYouEmails(eventId, mode);
      if (result.error) {
        setToast({ message: result.error, variant: "error" });
      } else if (result.failed && result.failed.length > 0) {
        setToast({
          message: `Sent to ${result.sent} of ${result.total}. Couldn't send to: ${result.failed.join(", ")}`,
          variant: "error",
        });
      } else {
        setToast({ message: `Sent to ${result.sent} player${result.sent === 1 ? "" : "s"}.`, variant: "success" });
      }
    });
  };

  const handlePrimary = () => {
    if (allSent) {
      run("all", `Everyone was already sent this. Resend it to all ${total} confirmed players?`);
    } else if (partial) {
      run("unsent", `Send the thank-you email to the ${remaining} player${remaining === 1 ? "" : "s"} who haven't received it yet?`);
    } else {
      run("unsent", "Send the thank-you email to every confirmed player for this event?");
    }
  };

  return (
    <div>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handlePrimary}>
        {pending ? "Sending…" : allSent ? "Resend Thank You Email" : partial ? `Send to Remaining (${remaining})` : "Send Thank You Email"}
      </Button>
      {alreadySentAt && (
        <p className="mt-1 text-[11px] text-tp-offwhite/40">
          Last sent {formatDateTime(alreadySentAt)} &middot; {sentCount} of {total} sent
        </p>
      )}
      {partial && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("all", `Resend to all ${total} confirmed players? Those who already got it will receive a duplicate.`)}
          className="mt-1 text-[11px] text-tp-offwhite/40 underline hover:text-tp-gold"
        >
          Resend to everyone
        </button>
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}
