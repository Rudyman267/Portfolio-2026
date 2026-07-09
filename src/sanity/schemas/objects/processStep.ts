import { defineField, defineType } from "sanity";
import { OlistIcon } from "@sanity/icons";

export const processStep = defineType({
  name: "processStep",
  title: "Process Step",
  type: "object",
  icon: OlistIcon,
  fields: [
    defineField({
      name: "stepNumber",
      title: "Step number",
      type: "number",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "media",
      title: "Media",
      type: "imageWithAlt",
    }),
  ],
  preview: {
    select: { title: "title", step: "stepNumber", media: "media" },
    prepare({ title, step, media }) {
      return {
        title: step ? `${step}. ${title}` : title,
        media,
      };
    },
  },
});
