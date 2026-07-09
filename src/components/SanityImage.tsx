import Image from "next/image";
import { urlFor } from "@/sanity/image";
import { cn } from "@/lib/utils";

/** Loose shape matching our image projections (alt, caption, lqip, dimensions). */
export type SanityImageSource = {
  asset?: { _ref?: string } | unknown;
  alt?: string | null;
  caption?: string | null;
  lqip?: string | null;
  dimensions?: { width?: number; height?: number; aspectRatio?: number } | null;
  hotspot?: unknown;
  crop?: unknown;
} | null;

export function SanityImage({
  image,
  sizes = "100vw",
  priority = false,
  className,
  width,
  quality = 90,
}: {
  image: SanityImageSource;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Target render width for the CDN transform. */
  width?: number;
  quality?: number;
}) {
  if (!image || !image.asset) return null;

  const dims = image.dimensions;
  const w = dims?.width ?? 1600;
  const h = dims?.height ?? Math.round(w / (dims?.aspectRatio ?? 1.6));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = urlFor(image as any)
    .width(width ?? Math.min(w, 2000))
    .quality(quality)
    .auto("format")
    .url();

  return (
    <Image
      src={src}
      alt={image.alt ?? ""}
      width={w}
      height={h}
      sizes={sizes}
      priority={priority}
      placeholder={image.lqip ? "blur" : "empty"}
      blurDataURL={image.lqip ?? undefined}
      className={cn("h-auto w-full", className)}
    />
  );
}
