import { PortableText, type PortableTextComponents } from "next-sanity";
import { SanityImage } from "@/components/SanityImage";
import { MetricCallout } from "./MetricCallout";
import { cn } from "@/lib/utils";

const ratioClass: Record<string, string> = {
  "1-1": "md:grid-cols-2",
  "3-2": "md:grid-cols-[3fr_2fr]",
  "2-3": "md:grid-cols-[2fr_3fr]",
};

const columnComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
    h3: ({ children }) => (
      <h3 className="mb-2 text-[var(--step-1)] font-semibold">{children}</h3>
    ),
  },
  types: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageWithAlt: ({ value }: any) => (
      <div className="my-3 overflow-hidden rounded-[var(--radius-md)] border border-border">
        <SanityImage image={value} sizes="(min-width: 768px) 360px, 100vw" />
      </div>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metricCallout: ({ value }: any) => <MetricCallout value={value} />,
  },
};

export function TwoColumn({
  value,
}: {
  value: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    left?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    right?: any;
    ratio?: string | null;
  };
}) {
  return (
    <div
      className={cn(
        "my-12 grid grid-cols-1 gap-8",
        ratioClass[value?.ratio ?? "1-1"],
      )}
    >
      <div>
        {value.left && (
          <PortableText value={value.left} components={columnComponents} />
        )}
      </div>
      <div>
        {value.right && (
          <PortableText value={value.right} components={columnComponents} />
        )}
      </div>
    </div>
  );
}
