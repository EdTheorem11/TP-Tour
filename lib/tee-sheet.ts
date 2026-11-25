export const MAX_GROUP_SIZE = 4;
const HOLES = 18;

export interface PackEntry {
  id: string;
  memberId: string;
  isGuest: boolean;
  entryDate: string;
  groupNumber: number | null;
  groupPosition: number | null;
  startingHole: number | null;
}

export interface PackedGroup {
  number: number;
  entryIds: string[];
  hole: number;
}

interface Bin {
  number: number;
  ids: string[];
  hole: number | null;
  cap: number;
}

const byEntryDate = (a: PackEntry, b: PackEntry) => a.entryDate.localeCompare(b.entryDate);

// Splits confirmed players into groups of at most MAX_GROUP_SIZE for a shotgun
// start, keeping every guest with the member who brought them, and gives each
// group a starting hole (1..18 in order, reusing holes — A/B — beyond that).
//
// keepExisting: leave groups that are already set as they are and only place
// players who have no group (into free spaces first, then new groups), and
// keep any hole already chosen. Otherwise everyone is re-split from scratch.
export function packShotgunGroups(entries: PackEntry[], keepExisting: boolean): PackedGroup[] {
  const sorted = [...entries].sort(byEntryDate);
  let bins: Bin[] = [];
  let toPlace: PackEntry[];

  if (keepExisting) {
    const byNumber = new Map<number, PackEntry[]>();
    for (const e of sorted) {
      if (e.groupNumber === null) continue;
      byNumber.set(e.groupNumber, [...(byNumber.get(e.groupNumber) ?? []), e]);
    }
    for (const [number, members] of byNumber) {
      members.sort((a, b) => (a.groupPosition ?? 999) - (b.groupPosition ?? 999));
      bins.push({
        number,
        ids: members.map((m) => m.id),
        hole: members.find((m) => m.startingHole !== null)?.startingHole ?? null,
        cap: MAX_GROUP_SIZE,
      });
    }
    toPlace = sorted.filter((e) => e.groupNumber === null);
  } else {
    toPlace = sorted;
  }
  bins.sort((a, b) => a.number - b.number);

  // Open just enough new groups for whoever won't fit in existing free
  // spaces, sized evenly (e.g. 69 players -> fifteen 4s and three 3s, not
  // seventeen 4s and one player on their own).
  const freeExisting = bins.reduce((sum, b) => sum + Math.max(0, b.cap - b.ids.length), 0);
  const remaining = Math.max(0, toPlace.length - freeExisting);
  const newCount = Math.ceil(remaining / MAX_GROUP_SIZE);
  let nextNumber = bins.reduce((max, b) => Math.max(max, b.number), 0) + 1;
  for (let i = 0; i < newCount; i++) {
    const cap = Math.floor(remaining / newCount) + (i < remaining % newCount ? 1 : 0);
    bins.push({ number: nextNumber++, ids: [], hole: null, cap });
  }

  const binOf = new Map<string, Bin>();
  for (const b of bins) for (const id of b.ids) binOf.set(id, b);
  const hostBinByMember = new Map<string, Bin>();
  for (const e of sorted) {
    const bin = binOf.get(e.id);
    if (bin && !e.isGuest) hostBinByMember.set(e.memberId, bin);
  }

  // Units that must stay together: a member plus the guests they brought.
  const unitsByMember = new Map<string, PackEntry[]>();
  for (const e of toPlace) unitsByMember.set(e.memberId, [...(unitsByMember.get(e.memberId) ?? []), e]);
  const units: PackEntry[][] = [];
  for (const members of unitsByMember.values()) {
    members.sort((a, b) => Number(a.isGuest) - Number(b.isGuest) || byEntryDate(a, b));
    for (let i = 0; i < members.length; i += MAX_GROUP_SIZE) units.push(members.slice(i, i + MAX_GROUP_SIZE));
  }
  units.sort((a, b) => b.length - a.length || byEntryDate(a[0], b[0]));

  for (const unit of units) {
    const free = (b: Bin) => b.cap - b.ids.length;
    const preferred = hostBinByMember.get(unit[0].memberId);
    let target: Bin | undefined = preferred && free(preferred) >= unit.length ? preferred : undefined;
    if (!target) {
      for (const b of bins) {
        if (free(b) >= unit.length && (!target || free(b) < free(target))) target = b;
      }
    }
    if (!target) {
      target = { number: nextNumber++, ids: [], hole: null, cap: MAX_GROUP_SIZE };
      bins.push(target);
    }
    target.ids.push(...unit.map((u) => u.id));
  }

  if (!keepExisting) {
    bins = bins.filter((b) => b.ids.length > 0);
    bins.forEach((b, i) => (b.number = i + 1));
  }

  const used = new Map<number, number>();
  for (const b of bins) if (b.hole !== null) used.set(b.hole, (used.get(b.hole) ?? 0) + 1);
  for (const b of bins) {
    if (b.hole !== null) continue;
    let best = 1;
    for (let h = 1; h <= HOLES; h++) if ((used.get(h) ?? 0) < (used.get(best) ?? 0)) best = h;
    b.hole = best;
    used.set(best, (used.get(best) ?? 0) + 1);
  }

  return bins.map((b) => ({ number: b.number, entryIds: b.ids, hole: b.hole as number }));
}
