"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Horizontal-scroll strip with left/right arrow buttons, so a mouse user
// (no trackpad, no horizontal wheel) can still page through the row.
export function ArrowScrollRow({ children, className }: { children: ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateArrows = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    updateArrows();
    el.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const shift = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div ref={scrollRef} className={className}>
        {children}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Scroll left"
          className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-tp-black/80 text-tp-offwhite backdrop-blur transition-colors hover:border-tp-gold hover:text-tp-gold lg:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Scroll right"
          className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-tp-black/80 text-tp-offwhite backdrop-blur transition-colors hover:border-tp-gold hover:text-tp-gold lg:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
