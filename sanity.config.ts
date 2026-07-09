import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { presentationTool } from "sanity/presentation";

import { apiVersion, dataset, projectId, studioUrl } from "@/sanity/env";
import { schema } from "@/sanity/schemas";
import { structure } from "@/sanity/structure";

export default defineConfig({
  name: "default",
  title: "Portfolio Studio",
  basePath: studioUrl,
  projectId,
  dataset,
  schema,
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        origin:
          typeof location === "undefined" ? "" : location.origin,
        previewMode: {
          enable: "/api/draft-mode/enable",
          disable: "/api/draft-mode/disable",
        },
      },
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
