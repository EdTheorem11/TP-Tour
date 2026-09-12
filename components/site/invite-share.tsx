"use client";

import { useState } from "react";
import { MessageCircle, Mail, Link2, Check } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";
const INVITE_URL = `${SITE_URL}/register`;
const INVITE_MESSAGE = `Here's the link to join TP Tour — it's a networking event I think you'd be interested in. Click the link and register: ${INVITE_URL}`;

export function InviteShare() {
  const [copied, setCopied] = useState(false);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(INVITE_MESSAGE)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent("Join me on TP Tour")}&body=${encodeURIComponent(INVITE_MESSAGE)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(INVITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — button stays usable, just no confirmation.
    }
  };

  return (
    <div className="border border-white/10 bg-tp-dark p-8">
      <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Invite Someone to TP Tour</h2>
      <p className="mt-2 text-sm text-tp-offwhite/60">
        Know someone who&rsquo;d fit right in? Send them a direct invite.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
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
    </div>
  );
}
