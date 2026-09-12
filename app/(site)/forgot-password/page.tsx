import { Container } from "@/components/ui/container";
import { ForgotPasswordForm } from "@/components/site/forgot-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <section className="flex min-h-[80vh] items-center py-20">
      <Container className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite">Forgot Password</h1>
        <p className="mt-4 text-tp-offwhite/60">
          Enter the email you registered with and we&rsquo;ll send you a link to reset your password.
        </p>
        <ForgotPasswordForm />
      </Container>
    </section>
  );
}
