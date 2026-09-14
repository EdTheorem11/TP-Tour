"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { clsx } from "clsx";

export function HeroBackground({
  src,
  videoSrc,
  mobileVideoSrc,
  alt,
  children,
  className,
}: {
  src: string;
  videoSrc?: string;
  mobileVideoSrc?: string;
  alt: string;
  children: ReactNode;
  className?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x, y });
  };

  const handleMouseLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={clsx("relative flex min-h-[92vh] items-center overflow-hidden bg-tp-black", className)}
    >
      <div
        className="absolute inset-[-4%] transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translate3d(${offset.x * -24}px, ${offset.y * -24}px, 0) scale(1.05)` }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          className={clsx(
            "object-cover",
            videoSrc && "sm:hidden",
            mobileVideoSrc && "max-sm:hidden",
          )}
        />
        {mobileVideoSrc && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={src}
            className="absolute inset-0 h-full w-full object-cover sm:hidden"
          >
            <source src={mobileVideoSrc} type="video/mp4" />
          </video>
        )}
        {videoSrc && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={src}
            className="absolute inset-0 hidden h-full w-full object-cover sm:block"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="absolute inset-0 bg-tp-black/55" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(31,122,85,0.35), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(195,164,109,0.18), transparent 60%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-tp-black to-transparent" />
      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}
