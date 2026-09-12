"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ProfileUpdateInput {
  firstName: string;
  lastName: string;
  mobile?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  homeGolfClub?: string;
  homeCourse?: string;
  linkedinUrl?: string;
  showCompanyPublicly: boolean;
  showJobTitlePublicly: boolean;
}

export async function updateMyProfile(input: ProfileUpdateInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { error: "First and last name are required." };
  }

  const { error } = await supabase
    .from("member_profiles")
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      mobile: input.mobile ?? null,
      company: input.company ?? null,
      job_title: input.jobTitle ?? null,
      industry: input.industry ?? null,
      home_golf_club: input.homeGolfClub ?? null,
      home_course: input.homeCourse ?? null,
      linkedin_url: input.linkedinUrl ?? null,
      show_company_publicly: input.showCompanyPublicly,
      show_job_title_publicly: input.showJobTitlePublicly,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/my-tp-tour");
  revalidatePath("/my-tp-tour/profile");
  revalidatePath(`/players/${user.id}`);
  return {};
}

export async function submitMyHandicapChange(newHandicap: number, reason: string): Promise<{ error?: string; pending?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.rpc("submit_handicap_change", {
    p_member_id: user.id,
    p_new_handicap: newHandicap,
    p_reason: reason,
    p_source: "member_submitted",
    p_changed_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/my-tp-tour");
  revalidatePath("/my-tp-tour/profile");
  return {};
}
