import { SanityImage, type SanityImageSource } from "@/components/SanityImage";
import { cn } from "@/lib/utils";

const colClass: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function ImageGallery({
  value,
}: {
  value: {
    images?: SanityImageSource[] | null;
    layout?: string | null;
    columns?: number | null;
  };
}) {
  const images = value?.images?.filter(Boolean) ?? [];
  if (images.length === 0) return null;
  const cols = value.columns ?? 2;

  if (value.layout === "carousel") {
    return (
      <div className="my-12 -mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-2">
        {images.map((img, i) => (
          <div
            key={i}
            className="w-[80%] shrink-0 snap-center overflow-hidden rounded-[var(--radius-lg)] border border-border sm:w-[48%]"
          >
            <SanityImage image={img} sizes="80vw" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "my-12 grid grid-cols-1 gap-4",
        colClass[cols] ?? colClass[2],
        value.layout === "masonry" && "sm:[&>*:nth-child(odd)]:mt-8",
      )}
    >
      {images.map((img, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[var(--radius-lg)] border border-border"
        >
          <SanityImage
            image={img}
            sizes={`(min-width: 640px) ${Math.round(100 / cols)}vw, 100vw`}
          />
        </div>
      ))}
    </div>
  );
}
