import { Container } from "@/components/ui/container";
import { ResetPasswordForm } from "@/components/site/reset-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return (
    <section className="flex min-h-[80vh] items-center py-20">
      <Container className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite">Reset Password</h1>
        <p className="mt-4 text-tp-offwhite/60">Choose a new password for your TP Tour account.</p>
        <ResetPasswordForm />
      </Container>
    </section>
  );
}
