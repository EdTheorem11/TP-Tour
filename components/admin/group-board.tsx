"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import { saveGroupAssignments } from "@/lib/actions/admin-events";
import { Button } from "@/components/ui/button";

export interface BoardEntry {
  id: string;
  name: string;
  handicap: string;
  isGuest: boolean;
  groupNumber: number | null;
  groupPosition: number | null;
}

interface BoardState {
  groups: Record<number, string[]>;
  unassigned: string[];
  groupOrder: number[];
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

function moveEntry(state: BoardState, entryId: string, toGroup: number | null, beforeEntryId: string | null): BoardState {
  const groups: Record<number, string[]> = {};
  for (const [g, ids] of Object.entries(state.groups)) groups[Number(g)] = ids.filter((id) => id !== entryId);
  const unassigned = state.unassigned.filter((id) => id !== entryId);

  if (toGroup === null) {
    const idx = beforeEntryId ? unassigned.indexOf(beforeEntryId) : -1;
    if (idx === -1) unassigned.push(entryId);
    else unassigned.splice(idx, 0, entryId);
  } else {
    const arr = groups[toGroup] ?? [];
    const idx = beforeEntryId ? arr.indexOf(beforeEntryId) : -1;
    if (idx === -1) arr.push(entryId);
    else arr.splice(idx, 0, entryId);
    groups[toGroup] = arr;
  }

  const groupOrder = [...new Set([...state.groupOrder, ...(toGroup !== null ? [toGroup] : [])])].sort((a, b) => a - b);
  return { groups, unassigned, groupOrder };
}

export function GroupBoard({ eventId, entries }: { eventId: string; entries: BoardEntry[] }) {
  const [state, setState] = useState<BoardState>(() => buildInitialState(entries));
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const draggedId = useRef<string | null>(null);
  const entryById = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);

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

  function handleDrop(toGroup: number | null, beforeEntryId: string | null) {
    setDragOverTarget(null);
    const id = draggedId.current;
    draggedId.current = null;
    if (!id) return;
    const next = moveEntry(state, id, toGroup, beforeEntryId);
    setState(next);
    persist(next);
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

  function PlayerCard({ id }: { id: string }) {
    const entry = entryById.get(id);
    if (!entry) return null;
    return (
      <div
        draggable
        onDragStart={() => {
          draggedId.current = id;
        }}
        onDragEnd={() => {
          draggedId.current = null;
          setDragOverTarget(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDrop(entry.groupNumber, id);
        }}
        className="flex cursor-grab items-center justify-between gap-2 border border-white/10 bg-tp-black px-3 py-2 text-sm active:cursor-grabbing"
      >
        <span className="truncate text-tp-offwhite">
          {entry.name}
          {entry.isGuest && <span className="ml-1 text-tp-offwhite/40">(Guest)</span>}
        </span>
        <span className="shrink-0 text-tp-offwhite/50">{entry.handicap}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <span className={clsx("text-[11px] font-semibold uppercase tracking-[0.1em]", isPending ? "text-tp-gold" : "text-tp-offwhite/30")}>
          {isPending ? "Saving…" : "All changes saved"}
        </span>
      </div>
      {error && <div className="mb-4 border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverTarget("unassigned");
        }}
        onDragLeave={() => setDragOverTarget((t) => (t === "unassigned" ? null : t))}
        onDrop={(e) => {
          e.preventDefault();
          handleDrop(null, null);
        }}
        className={clsx(
          "border p-4 transition-colors",
          dragOverTarget === "unassigned" ? "border-tp-gold bg-tp-gold/5" : "border-white/10 bg-tp-dark",
        )}
      >
        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-tp-offwhite/50">
          Unassigned ({state.unassigned.length})
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.unassigned.length === 0 && <p className="text-xs text-tp-offwhite/30">Everyone is assigned to a group.</p>}
          {state.unassigned.map((id) => (
            <div key={id} className="w-56">
              <PlayerCard id={id} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.groupOrder.map((g) => {
          const ids = state.groups[g] ?? [];
          const targetKey = `group-${g}`;
          return (
            <div
              key={g}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTarget(targetKey);
              }}
              onDragLeave={() => setDragOverTarget((t) => (t === targetKey ? null : t))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(g, null);
              }}
              className={clsx(
                "border-2 p-3 transition-colors",
                dragOverTarget === targetKey ? "border-tp-gold bg-tp-gold/10" : "border-tp-gold/40 bg-tp-gold/[0.03]",
                ids.length === 4 && "border-tp-gold/70",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-tp-gold px-1.5 font-heading text-xs font-bold text-tp-black">
                  {g}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-tp-offwhite/40">
                  {ids.length} player{ids.length === 1 ? "" : "s"}
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
              <div className="mt-3 space-y-2">
                {ids.map((id) => (
                  <PlayerCard key={id} id={id} />
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
    </div>
  );
}
