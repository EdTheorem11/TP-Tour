"use client";

import { useState } from "react";
import { MessageCircle, Mail, Link2, Check } from "lucide-react";

export function ShareLinkButtons({
  url,
  message,
  emailSubject = "Join TP Tour",
}: {
  url: string;
  message: string;
  emailSubject?: string;
}) {
  const [copied, setCopied] = useState(false);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — button stays usable, just no confirmation.
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 border border-white/15 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-tp-offwhite/80 transition-colors hover:border-tp-green hover:text-tp-offwhite"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
      <a
        href={emailHref}
        className="flex items-center gap-2 border border-white/15 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-tp-offwhite/80 transition-colors hover:border-tp-green hover:text-tp-offwhite"
      >
        <Mail className="h-4 w-4" />
        Email
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="flex items-center gap-2 border border-white/15 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-tp-offwhite/80 transition-colors hover:border-tp-gold hover:text-tp-gold"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
