import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { LoginForm } from "@/components/site/login-form";

export default function LoginPage() {
  return (
    <section className="flex min-h-[80vh] items-center py-20">
      <Container className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Welcome Back</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite">Login</h1>

        <Suspense>
          <LoginForm />
        </Suspense>
      </Container>
    </section>
  );
}
