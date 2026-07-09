"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { Tag } from "@/components/ui/Tag";
import type { PROJECTS_QUERY_RESULT } from "@/types/sanity.types";

export function WorkGrid({
  projects,
  showFilter = false,
}: {
  projects: PROJECTS_QUERY_RESULT;
  showFilter?: boolean;
}) {
  const allTags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [projects]);

  const [active, setActive] = useState<string | null>(null);

  const filtered = active
    ? projects.filter((p) => p.tags?.includes(active))
    : projects;

  return (
    <div>
      {showFilter && allTags.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2">
          <button onClick={() => setActive(null)} type="button">
            <Tag active={active === null}>All</Tag>
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t === active ? null : t)}
              type="button"
            >
              <Tag active={active === t}>{t}</Tag>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-8 gap-y-14 lg:grid-cols-2">
        {filtered.map((project, i) => (
          <ProjectCard key={project._id} project={project} priority={i < 2} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted">No projects yet.</p>
      )}
    </div>
  );
}
