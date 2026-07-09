import { PortableText } from "next-sanity";
import { SanityImage, type SanityImageSource } from "@/components/SanityImage";
import type { PortableTextBlock } from "@portabletext/react";

export function ProcessStep({
  value,
}: {
  value: {
    stepNumber?: number | null;
    title?: string | null;
    description?: PortableTextBlock[] | null;
    media?: SanityImageSource;
  };
}) {
  if (!value?.title) return null;
  return (
    <div className="my-10 grid gap-6 border-t border-border pt-8 sm:grid-cols-[auto_1fr]">
      <div className="text-[var(--step-2)] font-mono text-faint tabular-nums">
        {value.stepNumber != null
          ? String(value.stepNumber).padStart(2, "0")
          : "—"}
      </div>
      <div>
        <h4 className="text-[var(--step-1)] font-semibold">{value.title}</h4>
        {value.description && value.description.length > 0 && (
          <div className="mt-2 text-muted [&_p]:my-2">
            <PortableText value={value.description} />
          </div>
        )}
        {value.media && (
          <div className="mt-5 overflow-hidden rounded-[var(--radius-md)] border border-border">
            <SanityImage
              image={value.media}
              sizes="(min-width: 768px) 640px, 100vw"
            />
          </div>
        )}
      </div>
    </div>
  );
}
