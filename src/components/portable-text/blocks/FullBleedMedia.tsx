import { SanityImage, type SanityImageSource } from "@/components/SanityImage";
import { VideoBlock } from "./VideoBlock";

export function FullBleedMedia({
  value,
}: {
  value: {
    mediaType?: string | null;
    image?: SanityImageSource;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    video?: any;
    caption?: string | null;
  };
}) {
  const isVideo = value?.mediaType === "video";
  if (isVideo ? !value.video : !value.image) return null;

  return (
    <figure className="full-bleed my-16">
      {isVideo ? (
        <VideoBlock value={value.video} />
      ) : (
        <SanityImage image={value.image ?? null} sizes="100vw" />
      )}
      {value.caption && (
        <figcaption className="mx-auto mt-3 max-w-[var(--container-content)] px-[var(--gutter)] text-[var(--step--1)] text-muted">
          {value.caption}
        </figcaption>
      )}
    </figure>
  );
}
