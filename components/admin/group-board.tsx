"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import { saveGroupAssignments } from "@/lib/actions/admin-events";
import { Button } from "@/components/ui/button";
import { MAX_GROUP_SIZE } from "@/lib/tee-sheet";

export interface BoardEntry {
  id: string;
  name: string;
  handicap: string;
  isGuest: boolean;
  groupNumber: number | null;
  groupPosition: number | null;
  teeTime: string | null;
  startingHole: number | null;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

interface BoardState {
  groups: Record<number, string[]>;
  unassigned: string[];
  groupOrder: number[];
}

// Mirrors the printed day sheet: the 1st & 2nd player in a group are one
// pair, the 3rd & 4th are the other, so the board should show the same
// pairing rather than leaving admins to guess it from a plain list.
function chunkPairs<T>(list: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
  return rows;
}

function buildInitialState(entries: BoardEntry[]): BoardState {
  const groups: Record<number, string[]> = {};
  const unassigned: string[] = [];
  const byGroup = new Map<number, BoardEntry[]>();

  for (const e of entries) {
    if (e.groupNumber === null) {
      unassigned.push(e.id);
    } else {
      const list = byGroup.get(e.groupNumber) ?? [];
      list.push(e);
      byGroup.set(e.groupNumber, list);
    }
  }

  for (const [g, list] of byGroup) {
    list.sort((a, b) => (a.groupPosition ?? 999) - (b.groupPosition ?? 999));
    groups[g] = list.map((e) => e.id);
  }

  return { groups, unassigned, groupOrder: [...byGroup.keys()].sort((a, b) => a - b) };
}

// Move a player to the end of a group (or into Unassigned when toGroup is null).
function moveEntry(state: BoardState, entryId: string, toGroup: number | null): BoardState {
  const groups: Record<number, string[]> = {};
  for (const [g, ids] of Object.entries(state.groups)) groups[Number(g)] = ids.filter((id) => id !== entryId);
  const unassigned = state.unassigned.filter((id) => id !== entryId);

  if (toGroup === null) {
    unassigned.push(entryId);
  } else {
    groups[toGroup] = [...(groups[toGroup] ?? []), entryId];
  }

  const groupOrder = [...new Set([...state.groupOrder, ...(toGroup !== null ? [toGroup] : [])])].sort((a, b) => a - b);
  return { groups, unassigned, groupOrder };
}

// Two players trade places — in the same group (reorder) or across groups /
// Unassigned. Group sizes don't change, so a full group can still swap.
function swapEntries(state: BoardState, a: string, b: string): BoardState {
  const groups: Record<number, string[]> = {};
  for (const [g, ids] of Object.entries(state.groups)) groups[Number(g)] = [...ids];
  const unassigned = [...state.unassigned];
  const listOf = (id: string): string[] | null => {
    if (unassigned.includes(id)) return unassigned;
    return Object.values(groups).find((ids) => ids.includes(id)) ?? null;
  };
  const la = listOf(a);
  const lb = listOf(b);
  if (!la || !lb) return state;
  const ia = la.indexOf(a);
  const ib = lb.indexOf(b);
  la[ia] = b;
  lb[ib] = a;
  return { ...state, groups, unassigned };
}

export function GroupBoard({ eventId, entries }: { eventId: string; entries: BoardEntry[] }) {
  const [state, setState] = useState<BoardState>(() => buildInitialState(entries));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [drag, setDrag] = useState<{ id: string; width: number; height: number } | null>(null);
  const [overCard, setOverCard] = useState<string | null>(null);
  const [overZone, setOverZone] = useState<string | null>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, offX: 0, offY: 0 });
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });
  const entryById = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);

  // Tee time / hole shown on each group's header, taken from the group as it
  // was loaded so it doesn't change as players are swapped in and out.
  const groupInfo = useMemo(() => {
    const info = new Map<number, { teeTime: string | null; hole: number | null }>();
    for (const e of entries) {
      if (e.groupNumber === null) continue;
      const cur = info.get(e.groupNumber) ?? { teeTime: null, hole: null };
      info.set(e.groupNumber, { teeTime: cur.teeTime ?? e.teeTime, hole: cur.hole ?? e.startingHole });
    }
    return info;
  }, [entries]);

  function persist(next: BoardState) {
    const assignments: { id: string; group: number | null; position: number | null }[] = [];
    for (const [gStr, ids] of Object.entries(next.groups)) {
      const g = Number(gStr);
      ids.forEach((id, i) => assignments.push({ id, group: g, position: i + 1 }));
    }
    next.unassigned.forEach((id) => assignments.push({ id, group: null, position: null }));

    startTransition(() => {
      saveGroupAssignments(eventId, assignments)
        .then(() => setError(null))
        .catch(() => setError("Couldn't save that change — please try again."));
    });
  }

  function placeFloat() {
    const el = floatRef.current;
    if (el) el.style.transform = `translate(${pointer.current.x - pointer.current.offX}px, ${pointer.current.y - pointer.current.offY}px)`;
  }
  useLayoutEffect(() => {
    if (drag) placeFloat();
  }, [drag]);

  function finishDrop(id: string, card: string | null, zone: string | null) {
    const s = stateRef.current;
    let next: BoardState | null = null;

    if (card) {
      next = swapEntries(s, id, card);
    } else if (zone) {
      const toGroup = zone === "unassigned" ? null : Number(zone.replace("group-", ""));
      const inPlace = toGroup === null ? s.unassigned.includes(id) : (s.groups[toGroup] ?? []).includes(id);
      if (inPlace) return;
      if (toGroup !== null && (s.groups[toGroup] ?? []).length >= MAX_GROUP_SIZE) {
        setError(`Group ${toGroup} is full (max ${MAX_GROUP_SIZE}). Drop onto a player in it to swap with them.`);
        return;
      }
      next = moveEntry(s, id, toGroup);
    }
    if (!next) return;
    setError(null);
    setState(next);
    persist(next);
  }

  function startPress(e: React.PointerEvent<HTMLDivElement>, id: string) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointer.current = { x: e.clientX, y: e.clientY, offX: e.clientX - rect.left, offY: e.clientY - rect.top };
    const startX = e.clientX;
    const startY = e.clientY;
    let started = false;
    let raf = 0;
    let card: string | null = null;
    let zone: string | null = null;

    const hit = () => {
      const el = document.elementFromPoint(pointer.current.x, pointer.current.y) as HTMLElement | null;
      const cardId = el?.closest<HTMLElement>("[data-card-id]")?.dataset.cardId ?? null;
      card = cardId && cardId !== id ? cardId : null;
      zone = el?.closest<HTMLElement>("[data-zone]")?.dataset.zone ?? null;
      setOverCard(card);
      setOverZone(zone);
    };

    // Scroll the page while holding a tile near the top/bottom edge, so a
    // player can be carried to a group that's off screen.
    const edgeScroll = () => {
      const { y } = pointer.current;
      const edge = 90;
      if (y < edge) window.scrollBy(0, -Math.ceil((edge - y) / 5));
      else if (y > window.innerHeight - edge) window.scrollBy(0, Math.ceil((y - (window.innerHeight - edge)) / 5));
      hit();
      raf = requestAnimationFrame(edgeScroll);
    };

    const onMove = (ev: PointerEvent) => {
      pointer.current.x = ev.clientX;
      pointer.current.y = ev.clientY;
      if (!started) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 5) return;
        started = true;
        document.body.style.userSelect = "none";
        setDrag({ id, width: rect.width, height: rect.height });
        raf = requestAnimationFrame(edgeScroll);
      }
      placeFloat();
      hit();
    };

    const end = (drop: boolean) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      cancelAnimationFrame(raf);
      document.body.style.userSelect = "";
      if (started && drop) {
        hit();
        finishDrop(id, card, zone);
      }
      setDrag(null);
      setOverCard(null);
      setOverZone(null);
    };
    const onUp = () => end(true);
    const onCancel = () => end(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }

  function addGroup() {
    const nextNumber = (state.groupOrder.length > 0 ? Math.max(...state.groupOrder) : 0) + 1;
    setState((prev) => ({ ...prev, groups: { ...prev.groups, [nextNumber]: [] }, groupOrder: [...prev.groupOrder, nextNumber].sort((a, b) => a - b) }));
  }

  function removeEmptyGroup(g: number) {
    setState((prev) => ({
      ...prev,
      groups: Object.fromEntries(Object.entries(prev.groups).filter(([k]) => Number(k) !== g)),
      groupOrder: prev.groupOrder.filter((n) => n !== g),
    }));
  }

  function renderCard(id: string) {
    const entry = entryById.get(id);
    if (!entry) return null;
    const isSource = drag?.id === id;
    const isTarget = !!drag && overCard === id;
    return (
      <div
        key={id}
        data-card-id={id}
        onPointerDown={(e) => startPress(e, id)}
        className={clsx(
          "flex touch-none select-none items-center justify-between gap-2 border px-3 py-2 text-sm transition-colors",
          drag ? "cursor-grabbing" : "cursor-grab",
          isSource ? "border-dashed border-white/20 bg-tp-black/40 opacity-30" : "border-white/10 bg-tp-black",
          isTarget && "border-tp-gold bg-tp-gold/20 ring-2 ring-tp-gold",
        )}
      >
        <span className="truncate text-tp-offwhite">
          {entry.name}
          {entry.isGuest && <span className="ml-1 text-tp-offwhite/40">(Guest)</span>}
        </span>
        {isTarget ? (
          <span className="shrink-0 text-xs font-bold uppercase tracking-[0.1em] text-tp-gold">Swap</span>
        ) : (
          <span className="shrink-0 text-tp-offwhite/50">{entry.handicap}</span>
        )}
      </div>
    );
  }

  const floating = drag ? entryById.get(drag.id) : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs text-tp-offwhite/40">
          Drag a player onto another player to swap them (works in full groups too), or onto an empty spot to move them.
        </span>
        <span className={clsx("shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em]", isPending ? "text-tp-gold" : "text-tp-offwhite/30")}>
          {isPending ? "Saving…" : "All changes saved"}
        </span>
      </div>
      {error && <div className="mb-4 border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>}

      <div
        data-zone="unassigned"
        className={clsx(
          "border p-4 transition-colors",
          drag && overZone === "unassigned" && !overCard ? "border-tp-gold bg-tp-gold/5" : "border-white/10 bg-tp-dark",
        )}
      >
        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-tp-offwhite/50">
          Unassigned ({state.unassigned.length})
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.unassigned.length === 0 && <p className="text-xs text-tp-offwhite/30">Everyone is assigned to a group.</p>}
          {state.unassigned.map((id) => (
            <div key={id} className="w-56">
              {renderCard(id)}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.groupOrder.map((g) => {
          const ids = state.groups[g] ?? [];
          const targetKey = `group-${g}`;
          const info = groupInfo.get(g);
          return (
            <div
              key={g}
              data-zone={targetKey}
              className={clsx(
                "border-2 p-3 transition-colors",
                drag && overZone === targetKey && !overCard ? "border-tp-gold bg-tp-gold/10" : "border-tp-gold/40 bg-tp-gold/[0.03]",
                ids.length === MAX_GROUP_SIZE && "border-tp-gold/70",
                ids.length > MAX_GROUP_SIZE && "border-red-500/70 bg-red-500/[0.05]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-tp-gold px-1.5 font-heading text-xs font-bold text-tp-black">
                    {g}
                  </span>
                  {info && (info.teeTime || info.hole) && (
                    <span className="text-xs font-semibold text-tp-gold">
                      {info.teeTime ?? "Time TBC"}
                      {info.hole ? ` · ${ordinal(info.hole)} Tee` : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "text-[11px] font-semibold uppercase tracking-[0.1em]",
                      ids.length > MAX_GROUP_SIZE ? "text-red-400" : "text-tp-offwhite/40",
                    )}
                  >
                    {ids.length} player{ids.length === 1 ? "" : "s"}
                    {ids.length > MAX_GROUP_SIZE && ` — max ${MAX_GROUP_SIZE}, move someone`}
                  </span>
                  {ids.length === 0 && (
                    <button
                      type="button"
                      onClick={() => removeEmptyGroup(g)}
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {chunkPairs(ids).map((pairIds, ri) => (
                  <div
                    key={ri}
                    className={clsx(
                      "space-y-1.5 rounded-md border p-1.5",
                      ri % 2 === 0 ? "border-tp-gold/40 bg-tp-gold/[0.06]" : "border-white/15 bg-white/[0.03]",
                    )}
                  >
                    {pairIds.map((id) => renderCard(id))}
                  </div>
                ))}
                {ids.length === 0 && <p className="py-2 text-center text-xs text-tp-offwhite/30">Drop players here</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addGroup}>
        + Add Group
      </Button>

      {drag && floating && (
        <div
          ref={floatRef}
          className="pointer-events-none fixed left-0 top-0 z-50 flex rotate-2 items-center justify-between gap-2 border-2 border-tp-gold bg-tp-black px-3 py-2 text-sm shadow-2xl shadow-black/70"
          style={{ width: drag.width, height: drag.height }}
        >
          <span className="truncate font-semibold text-tp-offwhite">
            {floating.name}
            {floating.isGuest && <span className="ml-1 text-tp-offwhite/40">(Guest)</span>}
          </span>
          <span className="shrink-0 text-tp-offwhite/50">{floating.handicap}</span>
        </div>
      )}
    </div>
  );
}
