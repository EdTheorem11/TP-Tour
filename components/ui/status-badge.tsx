import { clsx } from "clsx";
import type { EventStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const styles: Record<EventStatus, string> = {
  draft: "bg-tp-black/80 text-tp-offwhite/60 border border-white/10 backdrop-blur-sm",
  coming_soon: "bg-tp-offwhite text-tp-black",
  entries_open: "bg-tp-green-light text-tp-black",
  limited_spaces: "bg-tp-gold text-tp-black",
  sold_out: "bg-red-500 text-white",
  completed: "bg-tp-offwhite/90 text-tp-black",
  cancelled: "bg-red-500 text-white line-through",
};

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] shadow-sm",
        styles[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
