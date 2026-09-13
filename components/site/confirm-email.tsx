"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { LinkButton } from "@/components/ui/button";
import { sendWelcomeEmailForConfirmedUser } from "@/lib/actions/auth";

export function ConfirmEmail() {
  const welcomeSent = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const trigger = () => {
      if (welcomeSent.current) return;
      welcomeSent.current = true;
      sendWelcomeEmailForConfirmedUser();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") trigger();
    });

    // Covers the case where the session was already established by the
    // time this component mounted (detectSessionInUrl runs on client init).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) trigger();
    });

    return () => subscription.unsubscribe();
  }, []);

  // By the time this page loads at all, Supabase's own /auth/v1/verify
  // endpoint has already confirmed the address server-side — an invalid or
  // expired link shows Supabase's own error page and never reaches here.
  // Whether *this* browser also picks up a session (it won't if the link
  // was opened on a different device than the one that registered) doesn't
  // change that the email is confirmed, so this always shows success.
  return (
    <div className="mt-10 border border-tp-green/40 bg-tp-green/10 p-6">
      <p className="font-heading text-lg font-bold uppercase text-tp-green-light">Email Address Confirmed</p>
      <p className="mt-2 text-sm text-tp-offwhite/70">
        Your TP Tour account is ready. Log in to enter events and connect with other members.
      </p>
      <LinkButton href="/login" variant="gold" size="lg" className="mt-5">
        Login
      </LinkButton>
    </div>
  );
}
