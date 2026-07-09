import { defineField, defineType, defineArrayMember } from "sanity";
import { UserIcon } from "@sanity/icons";

export const profile = defineType({
  name: "profile",
  title: "Profile",
  type: "document",
  icon: UserIcon,
  groups: [
    { name: "intro", title: "Intro", default: true },
    { name: "skills", title: "Skills & Tools" },
    { name: "experience", title: "Experience" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "intro",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      group: "intro",
    }),
    defineField({
      name: "portrait",
      title: "Portrait",
      type: "imageWithAlt",
      group: "intro",
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "richContent",
      group: "intro",
    }),
    defineField({
      name: "skills",
      title: "Skills",
      type: "array",
      group: "skills",
      of: [
        defineArrayMember({
          type: "object",
          name: "skillGroup",
          fields: [
            defineField({ name: "category", title: "Category", type: "string" }),
            defineField({
              name: "items",
              title: "Items",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
              options: { layout: "tags" },
            }),
          ],
          preview: {
            select: { title: "category", items: "items" },
            prepare({ title, items }) {
              return {
                title,
                subtitle: Array.isArray(items) ? items.join(", ") : "",
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "tools",
      title: "Tools / Stack",
      type: "array",
      group: "skills",
      description: "AI, design, and code tools you work with.",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    defineField({
      name: "experience",
      title: "Experience",
      type: "array",
      group: "experience",
      of: [
        defineArrayMember({
          type: "object",
          name: "role",
          fields: [
            defineField({ name: "role", title: "Role", type: "string" }),
            defineField({ name: "company", title: "Company", type: "string" }),
            defineField({ name: "period", title: "Period", type: "string" }),
            defineField({
              name: "summary",
              title: "Summary",
              type: "text",
              rows: 2,
            }),
          ],
          preview: {
            select: { title: "role", subtitle: "company" },
          },
        }),
      ],
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: {
    select: { title: "name", media: "portrait" },
    prepare({ title, media }) {
      return { title: title || "Profile", subtitle: "About page", media };
    },
  },
});
