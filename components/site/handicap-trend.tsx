import { formatHandicap } from "@/lib/format";
import type { MyHandicapHistoryEntry } from "@/lib/data/site";

// Lower handicap is better: a drop is an improvement (green, down arrow),
// a rise is worse (red, up arrow) — direction reflects the raw number,
// colour reflects whether that's good or bad for the player.
function directionColor(delta: number): string {
  if (delta < 0) return "text-tp-green-light";
  if (delta > 0) return "text-red-400";
  return "text-tp-offwhite/40";
}

function directionArrow(delta: number): string {
  if (delta < 0) return "▼";
  if (delta > 0) return "▲";
  return "—";
}

export function HandicapTrend({ history: allHistory }: { history: MyHandicapHistoryEntry[] }) {
  const history = allHistory.filter((h) => h.status === "approved");

  if (history.length < 2) {
    return <p className="mt-4 text-sm text-tp-offwhite/50">Handicap trend will appear here once it changes.</p>;
  }

  const values = history.map((h) => h.new_handicap);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 280;
  const height = 64;
  const stepX = width / (values.length - 1);

  // Lower handicap is better, so the best score plots highest on the chart.
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return { x, y };
  });

  const first = values[0];
  const last = values[values.length - 1];
  const overallDelta = last - first;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {points.slice(1).map((p, i) => {
          const prev = points[i];
          const segmentDelta = values[i + 1] - values[i];
          return (
            <line
              key={i}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              className={directionColor(segmentDelta)}
              stroke="currentColor"
              strokeWidth="2"
            />
          );
        })}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            className={i === 0 ? "text-tp-offwhite/40" : directionColor(values[i] - values[i - 1])}
            fill="currentColor"
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-tp-offwhite/50">
        <span>{formatHandicap(first)}</span>
        <span className={`flex items-center gap-1 font-semibold ${directionColor(overallDelta)}`}>
          {directionArrow(overallDelta)} {formatHandicap(last)} current
        </span>
      </div>
    </div>
  );
}
