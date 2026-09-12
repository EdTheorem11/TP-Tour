import { EventForm } from "@/components/admin/event-form";
import { getAllSeasonsAdmin, getAllGolfClubs, getAllPartnersAdmin } from "@/lib/data/admin";
import { createEvent } from "@/lib/actions/admin-events";

export default async function NewEventPage() {
  const [seasons, golfClubs, partners] = await Promise.all([
    getAllSeasonsAdmin(),
    getAllGolfClubs(),
    getAllPartnersAdmin(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Create Event</h1>
      <div className="mt-8 max-w-3xl">
        <EventForm action={createEvent} seasons={seasons} golfClubs={golfClubs} partners={partners} submitLabel="Create Event" />
      </div>
    </div>
  );
}
