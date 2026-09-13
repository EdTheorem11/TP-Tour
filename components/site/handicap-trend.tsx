import { formatHandicap } from "@/lib/format";

export function HandicapTrend({ history }: { history: Array<{ changed_at: string; new_handicap: number }> }) {
  if (history.length < 2) {
    return <p className="mt-4 text-sm text-tp-offwhite/50">Your handicap trend will appear here once it changes.</p>;
  }

  const values = history.map((h) => h.new_handicap);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 280;
  const height = 64;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  // Lower handicap is better, so the best score plots highest on the chart.
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return { x, y };
  });

  const first = values[0];
  const last = values[values.length - 1];
  const improved = last < first;
  const unchanged = last === first;
  const colorClass = unchanged ? "text-tp-offwhite/50" : improved ? "text-tp-green-light" : "text-tp-gold";

  return (
    <div className={colorClass}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="currentColor" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-tp-offwhite/50">
        <span>{formatHandicap(first)}</span>
        <span className={colorClass}>{formatHandicap(last)} current</span>
      </div>
    </div>
  );
}
