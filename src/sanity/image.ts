import { createImageUrlBuilder } from "@sanity/image-url";
import type { Image } from "sanity";
import { client } from "./client";

const builder = createImageUrlBuilder(client);

/** Build a Sanity CDN image URL. Always chain .width()/.height()/.quality(). */
export function urlFor(source: Image) {
  return builder.image(source);
}
