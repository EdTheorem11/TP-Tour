"use client";

import { useState, useTransition } from "react";
import { resendConfirmationEmailFromList } from "@/lib/actions/admin-members";
import { Toast } from "@/components/admin/toast";

export function MemberResendButton({
  memberId,
  memberName,
  memberEmail,
}: {
  memberId: string;
  memberName: string;
  memberEmail: string;
}) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await resendConfirmationEmailFromList(memberId);
            setToast(
              result.error
                ? { message: `Couldn't resend to ${memberName}: ${result.error}`, variant: "error" }
                : { message: `Confirmation email resent to ${memberName} (${memberEmail}).`, variant: "success" },
            );
          })
        }
        className="border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-tp-offwhite/70 hover:border-tp-gold hover:text-tp-gold disabled:opacity-40"
      >
        {pending ? "Sending…" : "Resend"}
      </button>
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </>
  );
}
