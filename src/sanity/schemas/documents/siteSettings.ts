import { defineField, defineType, defineArrayMember } from "sanity";
import { CogIcon } from "@sanity/icons";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "general", title: "General", default: true },
    { name: "nav", title: "Navigation & Social" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Site title / brand",
      type: "string",
      group: "general",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline / role",
      type: "string",
      group: "general",
      description: "e.g. AI-native Product Designer who ships code and design.",
    }),
    defineField({
      name: "email",
      title: "Contact email",
      type: "string",
      group: "general",
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: "resumeUrl",
      title: "Résumé URL",
      type: "url",
      group: "general",
    }),
    defineField({
      name: "nav",
      title: "Navigation links",
      type: "array",
      group: "nav",
      of: [defineArrayMember({ type: "link" })],
    }),
    defineField({
      name: "socials",
      title: "Social links",
      type: "array",
      group: "nav",
      of: [defineArrayMember({ type: "link" })],
    }),
    defineField({
      name: "footerText",
      title: "Footer note",
      type: "text",
      group: "general",
      rows: 2,
    }),
    defineField({
      name: "defaultSeo",
      title: "Default SEO",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
