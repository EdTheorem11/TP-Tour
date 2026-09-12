"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendHandicapUpdatedEmail } from "@/lib/email";

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

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function uploadMyAvatar(formData: FormData): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };
  if (!file.type.startsWith("image/")) return { error: "Please upload an image file." };
  if (file.size > MAX_AVATAR_BYTES) return { error: "Image must be under 5MB." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase.from("member_profiles").update({ avatar_url: url }).eq("id", user.id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/my-tp-tour");
  revalidatePath("/my-tp-tour/profile");
  revalidatePath(`/players/${user.id}`);
  revalidatePath("/players");
  return { url };
}

export async function removeMyAvatar(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("member_profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/my-tp-tour");
  revalidatePath("/my-tp-tour/profile");
  revalidatePath(`/players/${user.id}`);
  revalidatePath("/players");
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

  const { data: profile } = await supabase.from("member_profiles").select("email, first_name, current_handicap").eq("id", user.id).single();
  if (profile && Number(profile.current_handicap) === newHandicap) {
    await sendHandicapUpdatedEmail(profile.email, profile.first_name, newHandicap);
  }

  revalidatePath("/my-tp-tour");
  revalidatePath("/my-tp-tour/profile");
  return {};
}
