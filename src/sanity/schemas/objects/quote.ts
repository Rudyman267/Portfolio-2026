import { defineField, defineType } from "sanity";
import { BlockquoteIcon } from "@sanity/icons";

export const quote = defineType({
  name: "quote",
  title: "Quote",
  type: "object",
  icon: BlockquoteIcon,
  fields: [
    defineField({
      name: "text",
      title: "Quote",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "attribution",
      title: "Attribution",
      type: "string",
    }),
    defineField({
      name: "role",
      title: "Role / Context",
      type: "string",
    }),
  ],
  preview: {
    select: { text: "text", attribution: "attribution" },
    prepare({ text, attribution }) {
      return {
        title: text,
        subtitle: attribution,
      };
    },
  },
});
