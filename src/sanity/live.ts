import { defineLive } from "next-sanity/live";
import { client } from "./client";

const token = process.env.SANITY_API_READ_TOKEN;

/**
 * Sanity Live — provides `sanityFetch` (cache-tagged, draft-aware) and the
 * <SanityLive /> component. With a server token, draft preview works via
 * Presentation / Draft Mode. Without it, only published content is served.
 */
export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({
    // Live Content API requires a recent apiVersion.
    apiVersion: "vX",
  }),
  serverToken: token,
  browserToken: token,
});
