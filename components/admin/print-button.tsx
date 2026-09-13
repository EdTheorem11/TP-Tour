"use client";

export function PrintButton({ label = "Print Day Sheet" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/80 hover:border-tp-gold hover:text-tp-gold"
    >
      {label}
    </button>
  );
}
