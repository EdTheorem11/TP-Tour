import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/admin/form";
import { FORMAT_LABELS, STATUS_LABELS, type TourEvent, type Season } from "@/lib/types";
import type { GolfClub, Course } from "@/lib/types";

export function EventForm({
  action,
  event,
  seasons,
  golfClubs,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  event?: TourEvent;
  seasons: Season[];
  golfClubs: (GolfClub & { courses: Course[] })[];
  submitLabel: string;
}) {
  const selectedClub = golfClubs.find((c) => c.id === event?.golf_club_id);

  return (
    <form action={action} className="space-y-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Event Name">
          <input name="name" required defaultValue={event?.name} className={inputClass} />
        </Field>
        <Field label="Season">
          <select name="season_id" required defaultValue={event?.season_id} className={inputClass}>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Golf Club">
          <select name="golf_club_id" defaultValue={event?.golf_club_id ?? ""} className={inputClass}>
            <option value="">Select club</option>
            {golfClubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Course">
          <select name="course_id" defaultValue={event?.course_id ?? ""} className={inputClass}>
            <option value="">Select course</option>
            {(selectedClub?.courses ?? golfClubs.flatMap((c) => c.courses)).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <input name="location" defaultValue={event?.location ?? ""} className={inputClass} />
        </Field>
        <Field label="Hero Image URL">
          <input name="hero_image_url" defaultValue={event?.hero_image_url ?? ""} className={inputClass} />
        </Field>
        <Field label="Event Date">
          <input type="date" name="event_date" required defaultValue={event?.event_date} className={inputClass} />
        </Field>
        <Field label="Registration Opens">
          <input type="datetime-local" name="registration_opens_at" defaultValue={event?.registration_opens_at?.slice(0, 16) ?? ""} className={inputClass} />
        </Field>
        <Field label="Registration Deadline">
          <input type="datetime-local" name="registration_deadline" defaultValue={event?.registration_deadline?.slice(0, 16) ?? ""} className={inputClass} />
        </Field>
        <Field label="Arrival Time">
          <input name="arrival_time" defaultValue={event?.arrival_time ?? ""} className={inputClass} placeholder="e.g. 06:30" />
        </Field>
        <Field label="First Tee Time">
          <input name="first_tee_time" defaultValue={event?.first_tee_time ?? ""} className={inputClass} placeholder="e.g. 07:10" />
        </Field>
        <Field label="Shotgun Time">
          <input name="shotgun_time" defaultValue={event?.shotgun_time ?? ""} className={inputClass} />
        </Field>
        <Field label="Format">
          <select name="format" defaultValue={event?.format ?? ""} className={inputClass}>
            <option value="">TBC</option>
            {Object.entries(FORMAT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Max Players">
          <input type="number" name="max_players" defaultValue={event?.max_players ?? ""} className={inputClass} />
        </Field>
        <Field label="Handicap Allowance">
          <input name="handicap_allowance" defaultValue={event?.handicap_allowance ?? ""} className={inputClass} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={event?.status ?? "draft"} className={inputClass}>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-tp-offwhite/70">
          <input type="checkbox" name="oom_eligible" defaultChecked={event?.oom_eligible ?? true} />
          Order of Merit Eligible
        </label>
        <label className="flex items-center gap-2 text-sm text-tp-offwhite/70">
          <input type="checkbox" name="is_major" defaultChecked={event?.is_major ?? false} />
          Major Event
        </label>
      </div>

      <div className="grid gap-5">
        <Field label="Description">
          <textarea name="description" rows={3} defaultValue={event?.description ?? ""} className={inputClass} />
        </Field>
        <Field label="Competition Rules">
          <textarea name="competition_rules" rows={3} defaultValue={event?.competition_rules ?? ""} className={inputClass} />
        </Field>
        <Field label="Prizes">
          <textarea name="prizes" rows={2} defaultValue={event?.prizes ?? ""} className={inputClass} />
        </Field>
        <Field label="Dress Code">
          <textarea name="dress_code" rows={2} defaultValue={event?.dress_code ?? ""} className={inputClass} />
        </Field>
        <Field label="Course Information">
          <textarea name="course_information" rows={2} defaultValue={event?.course_information ?? ""} className={inputClass} />
        </Field>
      </div>

      <Button type="submit" variant="gold" size="lg">{submitLabel}</Button>
    </form>
  );
}
