import { Hero } from "@/components/site/homepage/hero";
import { NextOnTour } from "@/components/site/homepage/next-on-tour";
import { ScheduleStrip } from "@/components/site/homepage/schedule-strip";
import { PlayMoreGolf } from "@/components/site/homepage/play-more-golf";
import { OomPreview } from "@/components/site/homepage/oom-preview";
import { LatestResults } from "@/components/site/homepage/latest-results";
import { AboutStats } from "@/components/site/homepage/about-stats";
import { WhosOnTour } from "@/components/site/homepage/whos-on-tour";
import { PartnersStrip } from "@/components/site/homepage/partners-strip";
import { JoinCta } from "@/components/site/homepage/join-cta";
import {
  getCurrentSeason,
  getNextEvent,
  getEventCapacity,
  getSeasonEvents,
  getOrderOfMerit,
  getLatestCompletedEvent,
  getEventResults,
  getPartners,
  getSiteContent,
  getSeasonStats,
} from "@/lib/data/site";
import { getCurrentProfile } from "@/lib/data/current-user";

export default async function HomePage() {
  const season = await getCurrentSeason();
  const profile = await getCurrentProfile();
  const isLoggedIn = !!profile;

  const [nextEvent, scheduleEvents, standings, latestEvent, partners, hero, about, stats, seasonStats] =
    await Promise.all([
      getNextEvent(),
      season ? getSeasonEvents(season.id) : Promise.resolve([]),
      isLoggedIn && season ? getOrderOfMerit(season.id, 5) : Promise.resolve([]),
      getLatestCompletedEvent(),
      getPartners(),
      getSiteContent<{ eyebrow: string; heading: string; subheading: string }>("homepage_hero"),
      getSiteContent<{ headline: string; body: string }>("about_copy"),
      getSiteContent<{ members: string; tour_champions: string }>("homepage_stats"),
      season ? getSeasonStats(season.id) : Promise.resolve({ eventsCount: 0, coursesCount: 0 }),
    ]);

  const capacity = nextEvent ? await getEventCapacity(nextEvent.id) : null;
  const results = isLoggedIn && latestEvent ? await getEventResults(latestEvent.id) : [];

  return (
    <>
      <Hero
        eyebrow={hero?.eyebrow ?? "Dubai · Abu Dhabi · UAE"}
        heading={hero?.heading ?? "GOLF. NETWORK. COMPETE."}
        subheading={
          hero?.subheading ??
          "The UAE's leading golf society for professionals across Finance, Crypto, Digital Assets and FinTech."
        }
      />
      <NextOnTour event={nextEvent} capacity={capacity} />
      {scheduleEvents.length > 0 && <ScheduleStrip events={scheduleEvents} seasonName={season?.name ?? ""} />}
      <PlayMoreGolf />
      <OomPreview standings={standings} isLoggedIn={isLoggedIn} />
      <LatestResults event={latestEvent} results={results} isLoggedIn={isLoggedIn} />
      <AboutStats about={about} stats={stats} eventsCount={seasonStats.eventsCount} coursesCount={seasonStats.coursesCount} />
      <WhosOnTour />
      <PartnersStrip partners={partners} />
      <JoinCta />
    </>
  );
}
