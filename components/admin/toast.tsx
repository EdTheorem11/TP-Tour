"use client";

import { useEffect } from "react";

export function Toast({
  message,
  variant,
  onDismiss,
}: {
  message: string;
  variant: "success" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm border px-5 py-4 text-sm shadow-2xl shadow-black/50 ${
        variant === "success" ? "border-tp-green/40 bg-tp-dark text-tp-green-light" : "border-red-500/40 bg-tp-dark text-red-400"
      }`}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-sm p-1 text-tp-offwhite/40 transition-all duration-150 hover:bg-white/10 hover:text-tp-offwhite active:scale-90"
        aria-label="Dismiss"
      >
        &times;
      </button>
      <p className="pr-4">{message}</p>
    </div>
  );
}
