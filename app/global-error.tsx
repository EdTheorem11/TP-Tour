"use client";

import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-tp-black text-tp-offwhite">
        <div className="max-w-lg px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
          <h1 className="mt-4 text-3xl font-bold uppercase">Something Went Wrong</h1>
          <p className="mt-4 text-tp-offwhite/60">
            An unexpected error occurred loading the site. Please try again.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => reset()}
              className="bg-tp-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-tp-black"
            >
              Try Again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this file replaces the root layout on catastrophic errors, so the router context Link relies on may not be mounted */}
            <a
              href="/"
              className="border border-tp-offwhite/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em]"
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
