import { formatHandicap } from "@/lib/format";
import type { MyHandicapHistoryEntry } from "@/lib/data/site";

const statusLabel: Record<string, string> = {
  approved: "Approved",
  pending: "Pending Approval",
};

const statusClass: Record<string, string> = {
  approved: "text-tp-green-light",
  pending: "text-tp-gold",
};

export function HandicapHistoryList({ history }: { history: MyHandicapHistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="mt-4 text-sm text-tp-offwhite/50">No handicap changes recorded yet.</p>;
  }

  const sorted = [...history].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

  return (
    <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
      {sorted.map((h) => (
        <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
          <div>
            <span className="text-tp-offwhite">
              {h.old_handicap !== null ? `${formatHandicap(h.old_handicap)} → ` : ""}
              {formatHandicap(h.new_handicap)}
            </span>
            {h.reason && <span className="ml-2 text-tp-offwhite/40">{h.reason}</span>}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-tp-offwhite/40">{new Date(h.changed_at).toLocaleDateString("en-GB")}</span>
            <span className={`font-semibold uppercase tracking-[0.08em] ${statusClass[h.status] ?? "text-tp-offwhite/40"}`}>
              {statusLabel[h.status] ?? h.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
