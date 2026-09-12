import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntryPanel } from "@/components/site/entry-panel";
import { AddToCalendar } from "@/components/site/add-to-calendar";
import {
  getEventBySlug,
  getEventCapacity,
  getEventEntryList,
  getEventPhotos,
  getMyEventEntry,
  getMyWaitingListEntry,
  getPartnersForEvent,
} from "@/lib/data/site";
import { getCurrentProfile } from "@/lib/data/current-user";
import { FORMAT_LABELS } from "@/lib/types";
import { formatEventDateLong, formatPrice, formatHandicap, tbc } from "@/lib/format";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return {
    title: event.name,
    description: `TP Tour at ${event.name}, ${tbc(event.location)} — ${formatEventDateLong(event.event_date)}.`,
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const [capacity, entryList, partners, photos, profile] = await Promise.all([
    getEventCapacity(event.id),
    getEventEntryList(event.id),
    getPartnersForEvent(event.id),
    getEventPhotos(event.id),
    getCurrentProfile(),
  ]);

  const myEntry = profile ? await getMyEventEntry(event.id, profile.id) : null;
  const myWaitingListEntry = profile && !myEntry ? await getMyWaitingListEntry(event.id, profile.id) : null;

  const facts = [
    { label: "Date", value: formatEventDateLong(event.event_date) },
    { label: "Golf Club", value: tbc(event.golf_clubs?.name) },
    { label: "Course", value: tbc(event.courses?.name) },
    { label: "Location", value: tbc(event.location) },
    { label: "Arrival Time", value: tbc(event.arrival_time) },
    { label: "First Tee / Shotgun", value: tbc(event.first_tee_time ?? event.shotgun_time) },
    { label: "Format", value: event.format ? FORMAT_LABELS[event.format] : "TBC" },
    { label: "Member Price", value: formatPrice(event.member_price) },
    { label: "Guest Price", value: formatPrice(event.guest_price) },
    { label: "Max Players", value: tbc(capacity?.max_players) },
    { label: "Players Entered", value: String(capacity?.players_entered ?? 0) },
    { label: "Spaces Remaining", value: tbc(capacity?.spaces_remaining) },
    {
      label: "Registration Deadline",
      value: event.registration_deadline ? formatEventDateLong(event.registration_deadline.slice(0, 10)) : "TBC",
    },
    { label: "Handicap Allowance", value: tbc(event.handicap_allowance) },
    { label: "Order of Merit", value: event.oom_eligible ? "Eligible" : "Not Eligible" },
  ];

  return (
    <>
      <section className="relative flex h-[50vh] min-h-[380px] items-end overflow-hidden bg-gradient-to-br from-tp-green/30 to-tp-black">
        {event.hero_image_url && (
          <Image src={event.hero_image_url} alt={event.name} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-tp-black via-tp-black/40 to-transparent" />
        <Container className="relative z-10 pb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">TP Tour</p>
          <h1 className="mt-3 font-heading text-4xl font-bold uppercase text-tp-offwhite sm:text-6xl">
            {event.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge status={event.status} />
            <span className="text-tp-offwhite/60">{tbc(event.location)}</span>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="bg-tp-dark px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tp-offwhite/40">
                    {fact.label}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-tp-offwhite">{fact.value}</p>
                </div>
              ))}
            </div>

            {event.description && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">About This Event</h2>
                <p className="mt-3 whitespace-pre-line text-tp-offwhite/70">{event.description}</p>
              </div>
            )}

            {event.competition_rules && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">Competition Rules</h2>
                <p className="mt-3 whitespace-pre-line text-tp-offwhite/70">{event.competition_rules}</p>
              </div>
            )}

            {event.prizes && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">Prizes</h2>
                <p className="mt-3 whitespace-pre-line text-tp-offwhite/70">{event.prizes}</p>
              </div>
            )}

            {event.dress_code && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">Dress Code</h2>
                <p className="mt-3 whitespace-pre-line text-tp-offwhite/70">{event.dress_code}</p>
              </div>
            )}

            {event.course_information && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">Course Information</h2>
                <p className="mt-3 whitespace-pre-line text-tp-offwhite/70">{event.course_information}</p>
              </div>
            )}

            {partners.length > 0 && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">Sponsor</h2>
                <div className="mt-3 flex flex-wrap gap-6">
                  {partners.map((p) => (
                    <span key={p.id} className="text-tp-offwhite/70">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {photos.length > 0 && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">Photos</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="relative block aspect-square overflow-hidden bg-tp-dark"
                    >
                      <Image
                        src={photo.url}
                        alt={photo.caption ?? `${event.name} photo`}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {entryList.length > 0 && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">
                  Current Entry List ({entryList.length})
                </h2>
                <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                  {entryList.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between py-3">
                      <span className="text-tp-offwhite">
                        {entry.first_name} {entry.last_name}
                        {entry.is_guest && <span className="ml-2 text-xs text-tp-offwhite/40">(Guest)</span>}
                      </span>
                      <span className="text-sm text-tp-offwhite/50">{formatHandicap(entry.current_handicap)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <AddToCalendar event={event} />
            <EntryPanel
              eventId={event.id}
              eventSlug={event.slug}
              eventName={event.name}
              eventDate={formatEventDateLong(event.event_date)}
              memberPrice={event.member_price}
              isLoggedIn={!!profile}
              profile={profile}
              existingEntry={myEntry}
              waitingListEntry={myWaitingListEntry}
              spacesRemaining={capacity?.spaces_remaining ?? null}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
