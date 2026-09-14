import { EventForm } from "@/components/admin/event-form";
import { getAllSeasonsAdmin, getAllGolfClubs } from "@/lib/data/admin";
import { createEvent } from "@/lib/actions/admin-events";

export default async function NewEventPage() {
  const [seasons, golfClubs] = await Promise.all([
    getAllSeasonsAdmin(),
    getAllGolfClubs(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold uppercase text-tp-offwhite">Create Event</h1>
      <div className="mt-8 max-w-3xl">
        <EventForm action={createEvent} seasons={seasons} golfClubs={golfClubs} submitLabel="Create Event" />
      </div>
    </div>
  );
}
