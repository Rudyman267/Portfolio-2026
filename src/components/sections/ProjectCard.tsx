import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SanityImage } from "@/components/SanityImage";
import { Tag } from "@/components/ui/Tag";
import type { PROJECTS_QUERY_RESULT } from "@/types/sanity.types";

type Project = PROJECTS_QUERY_RESULT[number];

export function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  if (!project.slug) return null;
  return (
    <article className="group">
      <Link href={`/work/${project.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-2">
          {project.cover && (
            <div className="h-full w-full transform-gpu transition-transform duration-[var(--duration-slow)] ease-[var(--ease-emphasized)] group-hover:scale-[1.04]">
              <SanityImage
                image={project.cover}
                priority={priority}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-full object-cover"
              />
            </div>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[var(--step-1)] font-semibold">
              {project.title}
            </h3>
            {project.summary && (
              <p className="mt-1 max-w-md text-muted">{project.summary}</p>
            )}
          </div>
          <ArrowUpRight
            className="mt-1 shrink-0 text-faint transition-[transform,color] duration-[var(--duration-fast)] group-hover:-translate-y-0.5 group-hover:text-fg"
            size={22}
          />
        </div>
        {project.tags && project.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
      </Link>
    </article>
  );
}
