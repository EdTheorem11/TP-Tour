export function formatEventDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function formatEventDateShort(dateStr: string): { day: string; month: string } {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: d.toLocaleDateString("en-GB", { day: "2-digit" }),
    month: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
  };
}

export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "TBC";
  return `AED ${amount.toLocaleString("en-AE")}`;
}

export function tbc(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "TBC";
  return String(value);
}

export function formatHandicap(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(1);
}

export function movementIndicator(rank: number | null, previousRank: number | null): { symbol: string; direction: "up" | "down" | "same" } {
  if (rank === null || previousRank === null) return { symbol: "—", direction: "same" };
  const diff = previousRank - rank;
  if (diff > 0) return { symbol: `▲ ${diff}`, direction: "up" };
  if (diff < 0) return { symbol: `▼ ${Math.abs(diff)}`, direction: "down" };
  return { symbol: "—", direction: "same" };
}
