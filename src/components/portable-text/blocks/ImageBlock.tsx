import { SanityImage, type SanityImageSource } from "@/components/SanityImage";

export function ImageBlock({ value }: { value: SanityImageSource }) {
  if (!value) return null;
  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <SanityImage
          image={value}
          sizes="(min-width: 768px) 720px, 100vw"
        />
      </div>
      {value.caption && (
        <figcaption className="mt-3 text-[var(--step--1)] text-muted">
          {value.caption}
        </figcaption>
      )}
    </figure>
  );
}
