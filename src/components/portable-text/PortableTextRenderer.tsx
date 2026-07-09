import {
  PortableText,
  type PortableTextComponents,
} from "next-sanity";
import type { PortableTextBlock } from "@portabletext/react";
import Link from "next/link";
import type { Route } from "next";

import { ImageBlock } from "./blocks/ImageBlock";
import { ImageGallery } from "./blocks/ImageGallery";
import { VideoBlock } from "./blocks/VideoBlock";
import { MetricCallout } from "./blocks/MetricCallout";
import { QuoteBlock } from "./blocks/QuoteBlock";
import { FullBleedMedia } from "./blocks/FullBleedMedia";
import { CaptionedFigure } from "./blocks/CaptionedFigure";
import { ProcessStep } from "./blocks/ProcessStep";
import { TwoColumn } from "./blocks/TwoColumn";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="my-5 text-[var(--step-0)] leading-relaxed">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mt-14 mb-4 text-[var(--step-3)] font-semibold">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-10 mb-3 text-[var(--step-2)] font-semibold">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-8 mb-2 text-[var(--step-1)] font-semibold">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l-2 border-border pl-5 text-[var(--step-1)] text-muted italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-5 list-disc space-y-2 pl-6">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="my-5 list-decimal space-y-2 pl-6">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em]">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = (value?.href as string) ?? "#";
      const external = value?.isExternal || /^https?:\/\//.test(href);
      if (external) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent underline underline-offset-4"
          >
            {children}
          </a>
        );
      }
      return (
        <Link
          href={href as Route}
          className="text-accent underline underline-offset-4"
        >
          {children}
        </Link>
      );
    },
  },
  types: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageWithAlt: ({ value }: any) => <ImageBlock value={value} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageGallery: ({ value }: any) => <ImageGallery value={value} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videoEmbed: ({ value }: any) => <VideoBlock value={value} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metricCallout: ({ value }: any) => <MetricCallout value={value} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quote: ({ value }: any) => <QuoteBlock value={value} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fullBleedMedia: ({ value }: any) => <FullBleedMedia value={value} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    captionedFigure: ({ value }: any) => <CaptionedFigure value={value} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processStep: ({ value }: any) => <ProcessStep value={value} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    twoColumn: ({ value }: any) => <TwoColumn value={value} />,
  },
};

export function PortableTextRenderer({
  value,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: PortableTextBlock[] | any;
}) {
  if (!value) return null;
  return <PortableText value={value} components={components} />;
}
