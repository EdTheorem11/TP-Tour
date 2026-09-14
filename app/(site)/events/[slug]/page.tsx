import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntryPanel } from "@/components/site/entry-panel";
import { AddToCalendar } from "@/components/site/add-to-calendar";
import { ArrowScrollRow } from "@/components/ui/arrow-scroll-row";
import {
  getEventBySlug,
  getEventCapacity,
  getEventEntryList,
  getEventPhotos,
  getEventResults,
  getMyEventEntry,
  getMyWaitingListEntry,
  getPartnersForEvent,
} from "@/lib/data/site";
import { getCurrentProfile } from "@/lib/data/current-user";
import { FORMAT_LABELS } from "@/lib/types";
import { formatEventDateLong, formatHandicap, tbc } from "@/lib/format";
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

  const results = event.status === "completed" ? await getEventResults(event.id) : [];

  const myEntry = profile ? await getMyEventEntry(event.id, profile.id) : null;
  const myWaitingListEntry = profile && !myEntry ? await getMyWaitingListEntry(event.id, profile.id) : null;
  const myGuests = profile ? entryList.filter((e) => e.is_guest && e.member_id === profile.id) : [];

  const facts = [
    { label: "Date", value: formatEventDateLong(event.event_date) },
    { label: "Golf Club", value: tbc(event.golf_clubs?.name) },
    { label: "Course", value: tbc(event.courses?.name) },
    { label: "Location", value: tbc(event.location) },
    { label: "Arrival Time", value: tbc(event.arrival_time) },
    { label: "First Tee / Shotgun", value: tbc(event.first_tee_time ?? event.shotgun_time) },
    { label: "Format", value: event.format ? FORMAT_LABELS[event.format] : "TBC" },
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
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-xl shadow-black/30">
              <div className="grid grid-cols-2 gap-px sm:grid-cols-3">
                {facts.map((fact, i) => (
                  <div
                    key={fact.label}
                    className={`bg-tp-dark px-5 py-4 ${i === facts.length - 1 ? "col-span-full" : ""}`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-tp-offwhite/40">
                      {fact.label}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-tp-offwhite">{fact.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {event.status === "completed" && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">Leaderboard</h2>
                {!profile ? (
                  <p className="mt-3 text-tp-offwhite/60">
                    <Link href="/login" className="text-tp-gold hover:underline">Login</Link> or{" "}
                    <Link href="/register" className="text-tp-gold hover:underline">join TP Tour</Link> to see how
                    the field finished.
                  </p>
                ) : results.length === 0 ? (
                  <p className="mt-3 text-tp-offwhite/50">Results are being finalised.</p>
                ) : (
                  <>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 shadow-xl shadow-black/30">
                      <div className="divide-y divide-white/10 bg-tp-dark">
                        {results.slice(0, 10).map((r) => (
                          <div
                            key={r.id}
                            className={`flex items-center justify-between gap-4 px-5 py-3.5 ${
                              r.position === 1 ? "bg-tp-gold/[0.06]" : ""
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <span className="w-7 shrink-0 font-heading text-lg font-bold text-tp-offwhite">
                                {r.position_display}
                              </span>
                              <Link
                                href={`/players/${r.member_id}`}
                                className="font-semibold text-tp-offwhite hover:text-tp-gold"
                              >
                                {r.member_profiles?.first_name} {r.member_profiles?.last_name}
                              </Link>
                            </div>
                            <span className="font-heading text-lg font-bold text-tp-gold">
                              {tbc(r.event_scores?.stableford_points ?? r.event_scores?.nett_score)} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/results/${event.slug}`}
                      className="mt-4 inline-block text-sm text-tp-gold hover:underline"
                    >
                      Full Results &rarr;
                    </Link>
                  </>
                )}
              </div>
            )}

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
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">
                  {partners.length > 1 ? "Sponsors" : "Sponsor"}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  {partners.map((p) =>
                    p.logo_url ? (
                      <div
                        key={p.id}
                        className="flex items-center justify-center rounded-sm bg-tp-offwhite px-6 py-4"
                      >
                        <Image
                          src={p.logo_url}
                          alt={p.name}
                          width={140}
                          height={56}
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                    ) : (
                      <span key={p.id} className="text-tp-offwhite/70">
                        {p.name}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

            {photos.length > 0 && (
              <div className="mt-10">
                <h2 className="font-heading text-xl font-bold uppercase text-tp-offwhite">
                  Photos ({photos.length})
                </h2>
                <div className="mt-4">
                  <ArrowScrollRow className="no-scrollbar overflow-x-auto">
                    <div className="flex w-max gap-3">
                      {photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="relative block h-40 w-40 shrink-0 overflow-hidden bg-tp-dark sm:h-48 sm:w-48"
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
                  </ArrowScrollRow>
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
                        {entry.is_guest ? entry.guest_name : `${entry.first_name} ${entry.last_name}`}
                        {entry.is_guest && (
                          <span className="ml-2 text-xs text-tp-offwhite/40">
                            (Guest of {entry.first_name} {entry.last_name})
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-tp-offwhite/50">
                        {formatHandicap(entry.is_guest ? entry.playing_handicap : entry.current_handicap)}
                      </span>
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
              isLoggedIn={!!profile}
              profile={profile}
              existingEntry={myEntry}
              waitingListEntry={myWaitingListEntry}
              spacesRemaining={capacity?.spaces_remaining ?? null}
              myGuests={myGuests}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
