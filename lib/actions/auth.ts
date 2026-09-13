"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendWelcomeEmail, sendPasswordChangedEmail } from "@/lib/email";

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile?: string;
  nationality?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  homeGolfClub?: string;
  homeCourse?: string;
  currentHandicap?: string;
  egfWhsNumber?: string;
  linkedinUrl?: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export async function registerMember(input: RegisterInput): Promise<{ error?: string }> {
  if (!input.termsAccepted || !input.privacyAccepted) {
    return { error: "You must accept the terms and privacy policy." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${siteUrl}/confirm-email`,
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        mobile: input.mobile ?? null,
        nationality: input.nationality ?? null,
        company: input.company ?? null,
        job_title: input.jobTitle ?? null,
        industry: input.industry ?? null,
        home_golf_club: input.homeGolfClub ?? null,
        home_course: input.homeCourse ?? null,
        current_handicap: input.currentHandicap ?? null,
        egf_whs_number: input.egfWhsNumber ?? null,
        linkedin_url: input.linkedinUrl ?? null,
        terms_accepted: input.termsAccepted,
        privacy_accepted: input.privacyAccepted,
      },
    },
  });

  if (error) return { error: error.message };

  redirect("/register/success");
}

// Called from the confirm-email page once the user has actually verified
// their address — not at signup time, since they may never click the link.
export async function sendWelcomeEmailForConfirmedUser(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not signed in." };

  const { data: profile } = await supabase
    .from("member_profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  await sendWelcomeEmail(user.email, profile?.first_name ?? "there");
  return {};
}

// Called from the reset-password page right after supabase.auth.updateUser
// succeeds, so the member gets a security notice their password changed.
export async function sendPasswordChangedEmailForCurrentUser(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not signed in." };

  const { data: profile } = await supabase
    .from("member_profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  await sendPasswordChangedEmail(user.email, profile?.first_name ?? "there");
  return {};
}

export async function loginMember(email: string, password: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return {};
}

export async function logoutMember() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(email: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });
  // Don't reveal whether the email exists — always report success.
  if (error) console.error("resetPasswordForEmail error:", error.message);
  return {};
}
