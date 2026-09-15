"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { inviteMemberByEmail } from "@/lib/actions/admin-members";
import { Toast } from "@/components/admin/toast";

export function InviteMemberForm() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await inviteMemberByEmail(email);
      setToast(
        result.error
          ? { message: result.error, variant: "error" }
          : { message: `Invitation sent to ${email}.`, variant: "success" },
      );
      if (!result.error) setEmail("");
    });
  };

  return (
    <>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          type="email"
          required
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-white/15 bg-tp-black px-3 py-2 text-sm text-tp-offwhite placeholder:text-tp-offwhite/30 focus:border-tp-gold focus:outline-none"
        />
        <Button type="submit" variant="gold" size="sm" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </form>
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </>
  );
}
