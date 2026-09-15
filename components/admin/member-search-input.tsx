"use client";

import { useMemo, useState } from "react";
import { inputClass } from "@/components/admin/form";

interface SearchableMember {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

export function MemberSearchInput({ members }: { members: SearchableMember[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SearchableMember | null>(null);
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || selected) return [];
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)).slice(0, 8);
  }, [query, members, selected]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        required
        placeholder="Search member by name"
        value={selected ? selected.name : query}
        onChange={(e) => {
          setSelected(null);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={inputClass}
      />
      <input type="hidden" name="email" value={selected?.email ?? ""} />

      {open && matches.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto border border-white/15 bg-tp-dark shadow-xl">
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSelected(m);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white/5"
              >
                <span className="text-sm text-tp-offwhite">{m.name}</span>
                <span className="text-xs text-tp-offwhite/40">
                  {m.email}
                  {m.company && ` · ${m.company}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
