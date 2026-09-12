"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { loginMember } from "@/lib/actions/auth";

const inputClass =
  "w-full border border-white/15 bg-tp-dark px-4 py-3 text-sm text-tp-offwhite placeholder:text-tp-offwhite/30 focus:border-tp-gold focus:outline-none";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await loginMember(email, password);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.push(searchParams.get("next") ?? "/my-tp-tour");
    router.refresh();
  };

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
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/60">
            Password
          </label>
          <a href="/forgot-password" className="text-xs text-tp-offwhite/50 hover:text-tp-gold">
            Forgot password?
          </a>
        </div>
        <input
          type="password"
          required
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" variant="gold" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Logging In…" : "Login"}
      </Button>

      <p className="text-sm text-tp-offwhite/50">
        Not a member yet?{" "}
        <a href="/register" className="text-tp-gold hover:underline">
          Join TP Tour
        </a>
      </p>
    </form>
  );
}
