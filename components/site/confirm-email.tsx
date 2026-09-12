"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "confirmed" | "invalid";

export function ConfirmEmail() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setStatus("confirmed");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("confirmed");
    });

    const timeout = setTimeout(() => {
      setStatus((s) => (s === "checking" ? "invalid" : s));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (status !== "confirmed") return;
    const redirect = setTimeout(() => {
      router.push("/my-tp-tour");
      router.refresh();
    }, 1500);
    return () => clearTimeout(redirect);
  }, [status, router]);

  if (status === "checking") {
    return <p className="mt-10 text-tp-offwhite/50">Confirming your email…</p>;
  }

  if (status === "invalid") {
    return (
      <div className="mt-10 space-y-4">
        <p className="text-red-400">
          This confirmation link is invalid or has expired. Try logging in below — if your email still needs
          confirming, request a new link by registering again.
        </p>
        <a href="/login" className="inline-block text-tp-gold hover:underline">
          Go to Login &rarr;
        </a>
      </div>
    );
  }

  return (
    <div className="mt-10 border border-tp-green/40 bg-tp-green/10 p-6 text-sm text-tp-green-light">
      Your email is confirmed. Taking you to your TP Tour dashboard&hellip;
    </div>
  );
}
