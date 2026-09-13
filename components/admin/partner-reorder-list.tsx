"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { GripVertical } from "lucide-react";
import { reorderPartners } from "@/lib/actions/admin-content";
import type { Partner } from "@/lib/types";

export function PartnerReorderList({ partners }: { partners: Partner[] }) {
  const [order, setOrder] = useState(partners);
  const [dragId, setDragId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function moveTo(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const fromIndex = order.findIndex((p) => p.id === dragId);
    const toIndex = order.findIndex((p) => p.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrder(next);
    startTransition(() => {
      reorderPartners(next.map((p) => p.id));
    });
  }

  return (
    <ul className="divide-y divide-white/10 border border-white/10 bg-tp-dark">
      {order.map((p) => (
        <li
          key={p.id}
          draggable
          onDragStart={() => setDragId(p.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => moveTo(p.id)}
          onDragEnd={() => setDragId(null)}
          className={`flex items-center gap-4 px-4 py-3 transition-opacity ${dragId === p.id ? "opacity-40" : ""}`}
        >
          <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-tp-offwhite/30" aria-hidden />
          <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-sm bg-tp-offwhite/95">
            {p.logo_url && (
              <Image src={p.logo_url} alt="" width={56} height={32} className="h-7 w-auto object-contain" />
            )}
          </div>
          <span className="flex-1 text-sm font-semibold text-tp-offwhite">{p.name}</span>
          {!p.active && (
            <span className="text-xs font-normal uppercase tracking-[0.08em] text-red-400">Inactive</span>
          )}
        </li>
      ))}
      {order.length === 0 && <li className="px-4 py-3 text-sm text-tp-offwhite/50">No partners yet.</li>}
      {isPending && <li className="px-4 py-2 text-xs text-tp-offwhite/40">Saving order…</li>}
    </ul>
  );
}
