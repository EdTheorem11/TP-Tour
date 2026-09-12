"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/lib/actions/auth";

const inputClass =
  "w-full border border-white/15 bg-tp-dark px-4 py-3 text-sm text-tp-offwhite placeholder:text-tp-offwhite/30 focus:border-tp-gold focus:outline-none";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await requestPasswordReset(email);
    setSubmitting(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="mt-10 border border-tp-green/40 bg-tp-green/10 p-6 text-sm text-tp-green-light">
        If an account exists for {email}, a password reset link has been sent. Check your inbox (and spam folder).
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/60">
          Email
        </label>
        <input
          type="email"
          required
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" variant="gold" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Sending…" : "Send Reset Link"}
      </Button>
      <p className="text-sm text-tp-offwhite/50">
        Remembered it?{" "}
        <a href="/login" className="text-tp-gold hover:underline">
          Login
        </a>
      </p>
    </form>
  );
}
