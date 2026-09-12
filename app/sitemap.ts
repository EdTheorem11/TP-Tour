import type { MetadataRoute } from "next";
import { getSeasonEvents, getCurrentSeason } from "@/lib/data/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tptour.ae";

  const staticRoutes = [
    "",
    "/tour-schedule",
    "/order-of-merit",
    "/results",
    "/about",
    "/partners",
    "/register",
    "/login",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const season = await getCurrentSeason();
  const events = season ? await getSeasonEvents(season.id) : [];
  const eventRoutes = events.map((e) => ({
    url: `${siteUrl}/events/${e.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...eventRoutes];
}
