import { getAllSiteContent } from "@/lib/data/admin";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/lib/actions/admin-content";

interface MembershipSettings { require_approval?: boolean }
interface HandicapSettings { auto_approve?: boolean }

async function saveMembershipSettings(formData: FormData) {
  "use server";
  await updateSettings("membership_settings", { require_approval: formData.get("require_approval") === "on" });
}

async function saveHandicapSettings(formData: FormData) {
  "use server";
  await updateSettings("handicap_settings", { auto_approve: formData.get("auto_approve") === "on" });
}

export default async function AdminSettingsPage() {
  const content = await getAllSiteContent();
  const membershipSettings = (content.membership_settings ?? {}) as MembershipSettings;
  const handicapSettings = (content.handicap_settings ?? {}) as HandicapSettings;

  return (
    <div className="max-w-xl space-y-14">
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Settings</h1>

      <form action={saveMembershipSettings} className="space-y-4">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Membership</h2>
        <label className="flex items-center gap-3 text-sm text-tp-offwhite/70">
          <input type="checkbox" name="require_approval" defaultChecked={membershipSettings.require_approval ?? true} />
          New accounts require admin approval before entering events
        </label>
        <Button type="submit" variant="outline" size="sm">Save</Button>
      </form>

      <form action={saveHandicapSettings} className="space-y-4 border-t border-white/10 pt-10">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Handicaps</h2>
        <label className="flex items-center gap-3 text-sm text-tp-offwhite/70">
          <input type="checkbox" name="auto_approve" defaultChecked={handicapSettings.auto_approve ?? false} />
          Member-submitted handicap changes update immediately (no admin approval required)
        </label>
        <Button type="submit" variant="outline" size="sm">Save</Button>
      </form>

      <div className="border-t border-white/10 pt-10">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Roles</h2>
        <p className="mt-2 text-sm text-tp-offwhite/50">
          Manage admin access from each member&rsquo;s profile in the Members section. Only a Super Admin can grant
          Admin or Super Admin privileges.
        </p>
      </div>
    </div>
  );
}
