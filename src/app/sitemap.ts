import type { MetadataRoute } from "next";
import { client } from "@/sanity/client";
import { PROJECT_SLUGS_QUERY } from "@/sanity/queries";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugs = await client.fetch(PROJECT_SLUGS_QUERY);
    projectRoutes = slugs
      .filter((s) => s.slug)
      .map((s) => ({
        url: `${siteUrl}/work/${s.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }));
  } catch {
    // If Sanity isn't reachable at build time, ship static routes only.
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, priority: 1 },
    { url: `${siteUrl}/work`, priority: 0.9 },
    { url: `${siteUrl}/about`, priority: 0.7 },
  ];

  return [...staticRoutes, ...projectRoutes];
}
