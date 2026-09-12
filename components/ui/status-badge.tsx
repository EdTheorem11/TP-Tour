import { clsx } from "clsx";
import type { EventStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const styles: Record<EventStatus, string> = {
  draft: "text-tp-offwhite/60",
  coming_soon: "text-tp-offwhite/80",
  entries_open: "text-tp-green-light",
  limited_spaces: "text-tp-gold",
  sold_out: "text-red-400",
  completed: "text-tp-offwhite/70",
  cancelled: "text-red-400 line-through",
};

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border border-white/10 bg-tp-black/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] backdrop-blur-sm",
        styles[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
