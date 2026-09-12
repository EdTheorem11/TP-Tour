export const inputClass =
  "w-full border border-white/15 bg-tp-black px-3.5 py-2.5 text-sm text-tp-offwhite placeholder:text-tp-offwhite/30 focus:border-tp-gold focus:outline-none";
export const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/60";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
