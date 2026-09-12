"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Horizontal-scroll strip with a visible drag bar beneath it, so a mouse
// user (no trackpad, no horizontal wheel) can still pan the row.
export function DraggableScrollRow({ children, className }: { children: ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ width: 100, left: 0 });
  const draggingRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateThumb = () => {
      const ratio = el.clientWidth / el.scrollWidth;
      const width = Math.min(Math.max(ratio * 100, 8), 100);
      const maxScroll = el.scrollWidth - el.clientWidth;
      const left = maxScroll > 0 ? (el.scrollLeft / maxScroll) * (100 - width) : 0;
      setThumb({ width, left });
    };

    updateThumb();
    el.addEventListener("scroll", updateThumb);
    window.addEventListener("resize", updateThumb);
    return () => {
      el.removeEventListener("scroll", updateThumb);
      window.removeEventListener("resize", updateThumb);
    };
  }, []);

  const scrollToClientX = (clientX: number) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollLeft = Math.min(Math.max(ratio, 0), 1) * maxScroll;
  };

  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    scrollToClientX(e.clientX);
  };

  const onThumbPointerUp = () => {
    draggingRef.current = false;
  };

  const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    scrollToClientX(e.clientX);
  };

  return (
    <div>
      <div ref={scrollRef} className={className}>
        {children}
      </div>
      {thumb.width < 100 && (
        <div className="mt-5 px-6 lg:px-10">
          <div
            ref={trackRef}
            onClick={onTrackClick}
            className="relative h-1 cursor-pointer rounded-full bg-white/10"
          >
            <div
              onPointerDown={onThumbPointerDown}
              onPointerMove={onThumbPointerMove}
              onPointerUp={onThumbPointerUp}
              className="absolute top-1/2 h-2.5 -translate-y-1/2 cursor-grab touch-none rounded-full bg-tp-gold active:cursor-grabbing"
              style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
