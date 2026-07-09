import { SanityImage, type SanityImageSource } from "@/components/SanityImage";

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id =
        u.hostname.includes("youtu.be")
          ? u.pathname.slice(1)
          : u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function VideoBlock({
  value,
}: {
  value: {
    url?: string | null;
    file?: { asset?: { url?: string } } | null;
    poster?: SanityImageSource;
    caption?: string | null;
    autoplay?: boolean | null;
  };
}) {
  const embedUrl = value?.url ? toEmbedUrl(value.url) : null;
  const fileUrl =
    value?.file && "asset" in value.file ? value.file.asset?.url : undefined;

  if (!embedUrl && !fileUrl) {
    // Poster-only fallback.
    if (value?.poster) {
      return (
        <figure className="my-12">
          <SanityImage image={value.poster} sizes="100vw" />
        </figure>
      );
    }
    return null;
  }

  return (
    <figure className="my-12">
      <div className="relative aspect-video overflow-hidden rounded-[var(--radius-lg)] border border-border bg-fg/5">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={value.caption ?? "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <video
            src={fileUrl}
            controls={!value.autoplay}
            autoPlay={value.autoplay ?? false}
            muted={value.autoplay ?? false}
            loop={value.autoplay ?? false}
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
      {value.caption && (
        <figcaption className="mt-3 text-[var(--step--1)] text-muted">
          {value.caption}
        </figcaption>
      )}
    </figure>
  );
}
