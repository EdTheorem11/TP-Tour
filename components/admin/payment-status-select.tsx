"use client";

import { useTransition } from "react";
import { updateEntryPayment } from "@/lib/actions/admin-events";
import type { PaymentStatus } from "@/lib/types";

const paymentOptions: PaymentStatus[] = ["pending", "paid", "refunded", "complimentary", "not_required"];

export function PaymentStatusSelect({
  eventId,
  entryId,
  defaultValue,
}: {
  eventId: string;
  entryId: string;
  defaultValue: PaymentStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={defaultValue}
      disabled={pending}
      onChange={(e) => startTransition(() => updateEntryPayment(eventId, entryId, e.target.value as PaymentStatus))}
      className="border border-white/15 bg-tp-black px-2 py-1.5 text-xs text-tp-offwhite disabled:opacity-50"
    >
      {paymentOptions.map((opt) => (
        <option key={opt} value={opt}>
          {opt.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
