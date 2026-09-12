"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { registerMember } from "@/lib/actions/auth";
import { INDUSTRY_OPTIONS } from "@/lib/types";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  mobile: z.string().optional(),
  nationality: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  homeGolfClub: z.string().optional(),
  homeCourse: z.string().optional(),
  currentHandicap: z.string().optional(),
  egfWhsNumber: z.string().optional(),
  linkedinUrl: z.string().optional(),
  termsAccepted: z.boolean().refine((v) => v, "You must accept the competition rules"),
  privacyAccepted: z.boolean().refine((v) => v, "You must accept the privacy policy"),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full border border-white/15 bg-tp-dark px-4 py-3 text-sm text-tp-offwhite placeholder:text-tp-offwhite/30 focus:border-tp-gold focus:outline-none";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-tp-offwhite/60";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { termsAccepted: false, privacyAccepted: false },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError(null);
    const result = await registerMember(values);
    if (result?.error) {
      setServerError(result.error);
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 lg:py-28">
      <Container className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Join TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">
          Create Your Account
        </h1>
        <p className="mt-4 text-tp-offwhite/60">
          Golf. Network. Compete. Join the UAE&rsquo;s leading golf society for Finance &amp; Crypto professionals.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-12 space-y-10">
          <div className="space-y-5">
            <h2 className="font-heading text-lg font-semibold uppercase text-tp-offwhite">Personal</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First Name" error={errors.firstName?.message}>
                <input className={inputClass} {...register("firstName")} />
              </Field>
              <Field label="Last Name" error={errors.lastName?.message}>
                <input className={inputClass} {...register("lastName")} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input type="email" className={inputClass} {...register("email")} />
              </Field>
              <Field label="Mobile">
                <input className={inputClass} {...register("mobile")} />
              </Field>
              <Field label="Nationality">
                <input className={inputClass} {...register("nationality")} />
              </Field>
              <Field label="LinkedIn URL">
                <input className={inputClass} {...register("linkedinUrl")} />
              </Field>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="font-heading text-lg font-semibold uppercase text-tp-offwhite">Professional</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Company">
                <input className={inputClass} {...register("company")} />
              </Field>
              <Field label="Job Title">
                <input className={inputClass} {...register("jobTitle")} />
              </Field>
              <Field label="Industry">
                <select className={inputClass} {...register("industry")}>
                  <option value="">Select industry</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="font-heading text-lg font-semibold uppercase text-tp-offwhite">Golf</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Golf Club">
                <input className={inputClass} {...register("homeGolfClub")} />
              </Field>
              <Field label="Home Course">
                <input className={inputClass} {...register("homeCourse")} />
              </Field>
              <Field label="Current Handicap Index">
                <input className={inputClass} {...register("currentHandicap")} />
              </Field>
              <Field label="EGF / WHS Number">
                <input className={inputClass} {...register("egfWhsNumber")} />
              </Field>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="font-heading text-lg font-semibold uppercase text-tp-offwhite">Account</h2>
            <Field label="Password" error={errors.password?.message}>
              <input type="password" className={inputClass} {...register("password")} />
            </Field>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 text-sm text-tp-offwhite/70">
              <input type="checkbox" className="mt-0.5" {...register("termsAccepted")} />
              I agree to the competition rules and terms.
            </label>
            {errors.termsAccepted && <p className="text-xs text-red-400">{errors.termsAccepted.message}</p>}

            <label className="flex items-start gap-3 text-sm text-tp-offwhite/70">
              <input type="checkbox" className="mt-0.5" {...register("privacyAccepted")} />
              I agree to the privacy policy.
            </label>
            {errors.privacyAccepted && <p className="text-xs text-red-400">{errors.privacyAccepted.message}</p>}
          </div>

          {serverError && <p className="text-sm text-red-400">{serverError}</p>}

          <Button type="submit" variant="gold" size="lg" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Creating Account…" : "Create Account"}
          </Button>

          <p className="text-sm text-tp-offwhite/50">
            Already a member?{" "}
            <a href="/login" className="text-tp-gold hover:underline">
              Login
            </a>
          </p>
        </form>
      </Container>
    </section>
  );
}
