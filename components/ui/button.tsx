import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";
import Link from "next/link";
import { clsx } from "clsx";

const variants = {
  primary: "bg-tp-green text-tp-offwhite hover:bg-tp-green-light",
  gold: "bg-tp-gold text-tp-black hover:bg-tp-gold-light",
  outline: "border border-tp-offwhite/30 text-tp-offwhite hover:border-tp-offwhite hover:bg-tp-offwhite/5",
  ghost: "text-tp-offwhite hover:bg-tp-offwhite/5 hover:text-tp-gold",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

const sizes = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3.5 text-sm",
  lg: "px-8 py-4 text-sm",
};

const base =
  "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.12em] transition-all duration-150 active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100";

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; href: string }) {
  return (
    <Link href={href} className={clsx(base, variants[variant], sizes[size], className)} {...props} />
  );
}
