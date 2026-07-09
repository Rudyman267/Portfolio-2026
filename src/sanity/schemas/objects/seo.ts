import { defineField, defineType } from "sanity";
import { SearchIcon } from "@sanity/icons";

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  icon: SearchIcon,
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "string",
      validation: (rule) => rule.max(70).warning("Keep under ~70 characters."),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      validation: (rule) =>
        rule.max(160).warning("Keep under ~160 characters."),
    }),
    defineField({
      name: "ogImage",
      title: "Social share image",
      type: "image",
      description: "Falls back to a generated image if empty.",
    }),
    defineField({
      name: "noIndex",
      title: "Hide from search engines",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
