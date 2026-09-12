import { getAllSiteContent } from "@/lib/data/admin";
import { Field, inputClass } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { updateSiteContentValue } from "@/lib/actions/admin-content";

interface Hero { eyebrow?: string; heading?: string; subheading?: string }
interface Stats { members?: string; tour_champions?: string }
interface About { headline?: string; body?: string }
interface Social { linkedin?: string; instagram?: string }
interface Contact { email?: string; whatsapp?: string }

async function saveHero(formData: FormData) {
  "use server";
  await updateSiteContentValue("homepage_hero", {
    eyebrow: String(formData.get("eyebrow") ?? ""),
    heading: String(formData.get("heading") ?? ""),
    subheading: String(formData.get("subheading") ?? ""),
  });
}

async function saveStats(formData: FormData) {
  "use server";
  await updateSiteContentValue("homepage_stats", {
    members: String(formData.get("members") ?? ""),
    tour_champions: String(formData.get("tour_champions") ?? ""),
  });
}

async function saveAbout(formData: FormData) {
  "use server";
  await updateSiteContentValue("about_copy", {
    headline: String(formData.get("headline") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
}

async function saveSocial(formData: FormData) {
  "use server";
  await updateSiteContentValue("social_links", {
    linkedin: String(formData.get("linkedin") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
  });
}

async function saveContact(formData: FormData) {
  "use server";
  await updateSiteContentValue("contact_details", {
    email: String(formData.get("email") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
  });
}

export default async function AdminContentPage() {
  const content = await getAllSiteContent();
  const hero = (content.homepage_hero ?? {}) as Hero;
  const stats = (content.homepage_stats ?? {}) as Stats;
  const about = (content.about_copy ?? {}) as About;
  const social = (content.social_links ?? {}) as Social;
  const contact = (content.contact_details ?? {}) as Contact;

  return (
    <div className="max-w-2xl space-y-14">
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Content</h1>

      <form action={saveHero} className="space-y-4">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Homepage Hero</h2>
        <Field label="Eyebrow"><input name="eyebrow" defaultValue={hero.eyebrow} className={inputClass} /></Field>
        <Field label="Heading"><input name="heading" defaultValue={hero.heading} className={inputClass} /></Field>
        <Field label="Subheading"><textarea name="subheading" rows={2} defaultValue={hero.subheading} className={inputClass} /></Field>
        <Button type="submit" variant="outline" size="sm">Save Hero</Button>
      </form>

      <form action={saveStats} className="space-y-4 border-t border-white/10 pt-10">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Homepage Statistics</h2>
        <p className="text-xs text-tp-offwhite/40">
          Tour Events and Premium Courses are calculated automatically from the current season&rsquo;s schedule.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Members"><input name="members" defaultValue={stats.members} className={inputClass} /></Field>
          <Field label="Tour Champions"><input name="tour_champions" defaultValue={stats.tour_champions} className={inputClass} /></Field>
        </div>
        <Button type="submit" variant="outline" size="sm">Save Statistics</Button>
      </form>

      <form action={saveAbout} className="space-y-4 border-t border-white/10 pt-10">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">About Copy</h2>
        <Field label="Headline"><input name="headline" defaultValue={about.headline} className={inputClass} /></Field>
        <Field label="Body"><textarea name="body" rows={3} defaultValue={about.body} className={inputClass} /></Field>
        <Button type="submit" variant="outline" size="sm">Save About</Button>
      </form>

      <form action={saveSocial} className="space-y-4 border-t border-white/10 pt-10">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Social Links</h2>
        <Field label="LinkedIn"><input name="linkedin" defaultValue={social.linkedin} className={inputClass} /></Field>
        <Field label="Instagram"><input name="instagram" defaultValue={social.instagram} className={inputClass} /></Field>
        <Button type="submit" variant="outline" size="sm">Save Social</Button>
      </form>

      <form action={saveContact} className="space-y-4 border-t border-white/10 pt-10">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Contact Details</h2>
        <Field label="Email"><input name="email" defaultValue={contact.email} className={inputClass} /></Field>
        <Field label="WhatsApp"><input name="whatsapp" defaultValue={contact.whatsapp} className={inputClass} /></Field>
        <Button type="submit" variant="outline" size="sm">Save Contact</Button>
      </form>
    </div>
  );
}
