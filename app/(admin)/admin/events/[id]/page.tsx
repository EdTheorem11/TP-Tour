import { notFound } from "next/navigation";
import Image from "next/image";
import { EventForm } from "@/components/admin/event-form";
import { getAllSeasonsAdmin, getAllGolfClubs, getAllPartnersAdmin } from "@/lib/data/admin";
import { getEventPhotos } from "@/lib/data/site";
import { createClient } from "@/lib/supabase/server";
import {
  updateEvent,
  deleteEvent,
  assignEventPartner,
  removeEventPartner,
  uploadEventPhotos,
  deleteEventPhoto,
} from "@/lib/actions/admin-events";
import { Button, LinkButton } from "@/components/ui/button";
import type { TourEvent, Partner } from "@/lib/types";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; photosUploaded?: string; photosFailed?: string }>;
}) {
  const { id } = await params;
  const { saved, photosUploaded, photosFailed } = await searchParams;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  if (!event) notFound();

  const [seasons, golfClubs, partners, { data: assignedPartnerRows }, photos] = await Promise.all([
    getAllSeasonsAdmin(),
    getAllGolfClubs(),
    getAllPartnersAdmin(),
    supabase.from("event_partners").select("partner_id, partners(*)").eq("event_id", id),
    getEventPhotos(id),
  ]);

  const assignedPartners = ((assignedPartnerRows as unknown as Array<{ partner_id: string; partners: Partner }>) ?? []).map((r) => r.partners);
  const assignedIds = new Set(assignedPartners.map((p) => p.id));
  const availablePartners = partners.filter((p) => !assignedIds.has(p.id));

  const boundUpdate = updateEvent.bind(null, id);

  return (
    <div>
      {saved === "1" && (
        <div className="mb-6 border border-tp-green/40 bg-tp-green/10 px-5 py-3 text-sm text-tp-green-light">
          Changes saved.
        </div>
      )}
      {photosUploaded !== undefined && (
        <div
          className={`mb-6 border px-5 py-3 text-sm ${
            photosFailed && photosFailed !== "0"
              ? "border-tp-gold/40 bg-tp-gold/10 text-tp-gold"
              : "border-tp-green/40 bg-tp-green/10 text-tp-green-light"
          }`}
        >
          Uploaded {photosUploaded} photo{photosUploaded === "1" ? "" : "s"}.
          {photosFailed && photosFailed !== "0" && (
            <span className="block">
              {photosFailed} photo{photosFailed === "1" ? "" : "s"} couldn&rsquo;t be uploaded — each photo must be
              under 15MB and a recognised image format (JPG, PNG, etc).
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">{(event as TourEvent).name}</h1>
        <div className="flex gap-3">
          <LinkButton href={`/admin/entries/${id}`} variant="outline" size="sm">Entries</LinkButton>
          <LinkButton href={`/admin/scoring/${id}`} variant="outline" size="sm">Scoring</LinkButton>
        </div>
      </div>

      <div className="mt-8 max-w-3xl">
        <EventForm action={boundUpdate} event={event as TourEvent} seasons={seasons} golfClubs={golfClubs} submitLabel="Save Changes" />
      </div>

      <div className="mt-12 max-w-3xl border-t border-white/10 pt-8">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Event Partners</h2>
        <ul className="mt-4 space-y-2">
          {assignedPartners.map((p) => (
            <li key={p.id} className="flex items-center justify-between border border-white/10 bg-tp-dark px-4 py-2.5">
              <span>{p.name}</span>
              <form action={removeEventPartner.bind(null, id, p.id)}>
                <button className="text-xs text-red-400 hover:underline">Remove</button>
              </form>
            </li>
          ))}
        </ul>
        {availablePartners.length > 0 && (
          <form action={async (fd: FormData) => {
            "use server";
            const partnerId = String(fd.get("partner_id"));
            await assignEventPartner(id, partnerId);
          }} className="mt-4 flex gap-3">
            <select name="partner_id" className="border border-white/15 bg-tp-black px-3.5 py-2.5 text-sm text-tp-offwhite">
              {availablePartners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm">Assign Partner</Button>
          </form>
        )}
      </div>

      <div className="mt-12 max-w-3xl border-t border-white/10 pt-8">
        <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Photo Gallery</h2>

        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden bg-tp-black">
                <Image src={photo.url} alt={photo.caption ?? "Event photo"} fill className="object-cover" />
                <form
                  action={deleteEventPhoto.bind(null, id, photo.id, photo.storage_path)}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <button type="submit" className="text-xs font-semibold uppercase tracking-[0.1em] text-red-400 hover:underline">
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <form action={uploadEventPhotos.bind(null, id)} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            required
            className="text-sm text-tp-offwhite/70 file:mr-3 file:border file:border-white/15 file:bg-tp-black file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.1em] file:text-tp-offwhite"
          />
          <Button type="submit" variant="outline" size="sm">Upload Photos</Button>
        </form>
      </div>

      <div className="mt-12 max-w-3xl border-t border-white/10 pt-8">
        <h2 className="font-heading text-lg font-bold uppercase text-red-400">Danger Zone</h2>
        <form action={deleteEvent.bind(null, id)} className="mt-4">
          <button type="submit" className="text-sm text-red-400 hover:underline">
            Delete this event permanently
          </button>
        </form>
      </div>
    </div>
  );
}
