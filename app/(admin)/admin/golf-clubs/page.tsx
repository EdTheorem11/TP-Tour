import { getAllGolfClubs } from "@/lib/data/admin";
import { Field, inputClass } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { createGolfClub, addCourseToClub } from "@/lib/actions/admin-events";
import { tbc } from "@/lib/format";

export default async function AdminGolfClubsPage() {
  const clubs = await getAllGolfClubs();

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Golf Clubs</h1>

      <details className="mt-6 max-w-xl">
        <summary className="cursor-pointer text-sm text-tp-gold">+ Add Golf Club</summary>
        <form action={createGolfClub} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Club Name"><input name="name" required className={inputClass} /></Field>
          <Field label="Location"><input name="location" className={inputClass} /></Field>
          <Field label="Emirate"><input name="emirate" className={inputClass} /></Field>
          <Field label="Website"><input name="website" className={inputClass} /></Field>
          <Field label="Logo URL"><input name="logo_url" className={inputClass} /></Field>
          <Field label="Hero Image URL"><input name="hero_image_url" className={inputClass} /></Field>
          <Field label="Course Name"><input name="course_name" className={inputClass} /></Field>
          <Field label="Par"><input type="number" name="par" className={inputClass} /></Field>
          <Field label="Course Rating"><input type="number" step="0.1" name="course_rating" className={inputClass} /></Field>
          <Field label="Slope Rating"><input type="number" name="slope_rating" className={inputClass} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea name="description" rows={2} className={inputClass} /></Field>
          <div className="sm:col-span-2"><Button type="submit" variant="gold" size="sm">Create Club</Button></div>
        </form>
      </details>

      <div className="mt-10 space-y-6">
        {clubs.map((club) => (
          <div key={club.id} className="border border-white/10 bg-tp-dark p-6">
            <p className="font-heading text-lg font-bold uppercase text-tp-offwhite">{club.name}</p>
            <p className="text-sm text-tp-offwhite/50">{tbc(club.location)} &middot; {tbc(club.emirate)}</p>

            <ul className="mt-3 space-y-1 text-sm text-tp-offwhite/60">
              {club.courses.map((c) => (
                <li key={c.id}>
                  {c.name} {c.par ? `· Par ${c.par}` : ""}
                </li>
              ))}
            </ul>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-tp-gold">+ Add Course</summary>
              <form action={addCourseToClub.bind(null, club.id)} className="mt-3 flex flex-wrap items-end gap-3">
                <Field label="Course Name"><input name="name" required className={inputClass} /></Field>
                <Field label="Par"><input type="number" name="par" className={inputClass + " w-20"} /></Field>
                <Button type="submit" variant="outline" size="sm">Add</Button>
              </form>
            </details>
          </div>
        ))}
        {clubs.length === 0 && <p className="text-tp-offwhite/50">No golf clubs yet.</p>}
      </div>
    </div>
  );
}
