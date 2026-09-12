import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getCurrentProfile } from "@/lib/data/current-user";
import { ProfileForm } from "@/components/site/profile-form";

export default async function MyProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/my-tp-tour/profile");

  return (
    <section className="py-16 lg:py-20">
      <Container className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">My TP Tour</p>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-5xl">
          My Profile
        </h1>
        <div className="mt-12">
          <ProfileForm profile={profile} />
        </div>
      </Container>
    </section>
  );
}
