"use client";

import { useState, useTransition } from "react";
import { sendEventThankYouEmails } from "@/lib/actions/admin-events";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/admin/toast";
import { formatDateTime } from "@/lib/format";

export function SendThankYouButton({ eventId, alreadySentAt }: { eventId: string; alreadySentAt: string | null }) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const handleSend = () => {
    const confirmMessage = alreadySentAt
      ? `This was already sent on ${formatDateTime(alreadySentAt)}. Send it again to everyone confirmed for this event?`
      : "Send the thank-you email to every confirmed player for this event?";
    if (!window.confirm(confirmMessage)) return;

    startTransition(async () => {
      const result = await sendEventThankYouEmails(eventId);
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

  return (
    <div>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleSend}>
        {pending ? "Sending…" : alreadySentAt ? "Resend Thank You Email" : "Send Thank You Email"}
      </Button>
      {alreadySentAt && <p className="mt-1 text-[11px] text-tp-offwhite/40">Last sent {formatDateTime(alreadySentAt)}</p>}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}
