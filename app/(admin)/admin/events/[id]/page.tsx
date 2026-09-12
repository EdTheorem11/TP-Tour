import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { getAllSeasonsAdmin, getAllGolfClubs, getAllPartnersAdmin } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";
import { updateEvent, deleteEvent, assignEventPartner, removeEventPartner } from "@/lib/actions/admin-events";
import { Button, LinkButton } from "@/components/ui/button";
import type { TourEvent, Partner } from "@/lib/types";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  if (!event) notFound();

  const [seasons, golfClubs, partners, { data: assignedPartnerRows }] = await Promise.all([
    getAllSeasonsAdmin(),
    getAllGolfClubs(),
    getAllPartnersAdmin(),
    supabase.from("event_partners").select("partner_id, partners(*)").eq("event_id", id),
  ]);

  const assignedPartners = ((assignedPartnerRows as unknown as Array<{ partner_id: string; partners: Partner }>) ?? []).map((r) => r.partners);
  const assignedIds = new Set(assignedPartners.map((p) => p.id));
  const availablePartners = partners.filter((p) => !assignedIds.has(p.id));

  const boundUpdate = updateEvent.bind(null, id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">{(event as TourEvent).name}</h1>
        <div className="flex gap-3">
          <LinkButton href={`/admin/entries/${id}`} variant="outline" size="sm">Entries</LinkButton>
          <LinkButton href={`/admin/scoring/${id}`} variant="outline" size="sm">Scoring</LinkButton>
        </div>
      </div>

      <div className="mt-8 max-w-3xl">
        <EventForm action={boundUpdate} event={event as TourEvent} seasons={seasons} golfClubs={golfClubs} partners={partners} submitLabel="Save Changes" />
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
