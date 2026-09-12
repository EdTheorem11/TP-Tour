import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { getCurrentProfile } from "@/lib/data/current-user";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <>
      <Nav
        isLoggedIn={!!profile}
        firstName={profile?.first_name}
        avatarUrl={profile?.avatar_url}
        memberId={profile?.id}
        isAdmin={!!profile && ["admin", "super_admin"].includes(profile.role)}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
