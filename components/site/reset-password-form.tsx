"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { sendPasswordChangedEmailForCurrentUser } from "@/lib/actions/auth";

const inputClass =
  "w-full border border-white/15 bg-tp-dark px-4 py-3 text-sm text-tp-offwhite placeholder:text-tp-offwhite/30 focus:border-tp-gold focus:outline-none";

type Status = "checking" | "ready" | "invalid";

export function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("ready");
    });

    const timeout = setTimeout(() => {
      setStatus((s) => (s === "checking" ? "invalid" : s));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    sendPasswordChangedEmailForCurrentUser();

    router.push("/my-tp-tour");
    router.refresh();
  };

  if (status === "checking") {
    return <p className="mt-10 text-tp-offwhite/50">Verifying your reset link…</p>;
  }

  if (status === "invalid") {
    return (
      <div className="mt-10 space-y-4">
        <p className="text-red-400">
          This reset link is invalid or has expired. Request a new one below.
        </p>
        <a href="/forgot-password" className="inline-block text-tp-gold hover:underline">
          Request a new link &rarr;
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/60">
          New Password
        </label>
        <input
          type="password"
          required
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/60">
          Confirm New Password
        </label>
        <input
          type="password"
          required
          className={inputClass}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" variant="gold" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Set New Password"}
      </Button>
    </form>
  );
}
