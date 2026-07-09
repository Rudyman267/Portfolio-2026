import { PortableText } from "next-sanity";
import { SanityImage, type SanityImageSource } from "@/components/SanityImage";
import { cn } from "@/lib/utils";
import type { PortableTextBlock } from "@portabletext/react";

export function CaptionedFigure({
  value,
}: {
  value: {
    image?: SanityImageSource;
    caption?: PortableTextBlock[] | null;
    width?: string | null;
  };
}) {
  if (!value?.image) return null;
  const full = value.width === "full";
  return (
    <figure className={cn("my-12", full && "lg:-mx-24")}>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <SanityImage
          image={value.image}
          sizes={full ? "100vw" : "(min-width: 768px) 720px, 100vw"}
        />
      </div>
      {value.caption && value.caption.length > 0 && (
        <figcaption className="mt-3 text-[var(--step--1)] text-muted [&_a]:underline">
          <PortableText value={value.caption} />
        </figcaption>
      )}
    </figure>
  );
}
