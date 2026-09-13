import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Server-only, and only for
// operations the regular user/session client can't do (e.g. deleting an
// auth.users row, which cascades to member_profiles and everything under it).
// Never import this from a Client Component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
