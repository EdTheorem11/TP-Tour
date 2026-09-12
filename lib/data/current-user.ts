import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { MemberProfile } from "@/lib/types";

export async function getCurrentProfile(): Promise<MemberProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as MemberProfile) ?? null;
}
