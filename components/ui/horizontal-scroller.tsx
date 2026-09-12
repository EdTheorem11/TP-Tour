"use client";

import { useRef, type ReactNode, type WheelEvent } from "react";

// Lets a mouse wheel (vertical scroll only, unlike a trackpad) drive
// horizontal scrolling on strips like the homepage schedule cards.
export function HorizontalScroller({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  };

  return (
    <div ref={ref} onWheel={onWheel} className={className}>
      {children}
    </div>
  );
}
