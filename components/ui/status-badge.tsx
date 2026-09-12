import { clsx } from "clsx";
import type { EventStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const styles: Record<EventStatus, string> = {
  draft: "bg-white/10 text-tp-offwhite/50",
  coming_soon: "bg-white/10 text-tp-offwhite/70",
  entries_open: "bg-tp-green/20 text-tp-green-light",
  limited_spaces: "bg-tp-gold/20 text-tp-gold",
  sold_out: "bg-red-500/15 text-red-400",
  completed: "bg-white/10 text-tp-offwhite/60",
  cancelled: "bg-red-500/15 text-red-400 line-through",
};

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
        styles[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
