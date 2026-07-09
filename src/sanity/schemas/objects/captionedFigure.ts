import { defineField, defineType, defineArrayMember } from "sanity";
import { ImageIcon } from "@sanity/icons";

export const captionedFigure = defineType({
  name: "captionedFigure",
  title: "Captioned Figure",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "imageWithAlt",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Rich caption",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
            ],
            annotations: [{ type: "link" }],
          },
        }),
      ],
    }),
    defineField({
      name: "width",
      title: "Width",
      type: "string",
      options: {
        list: [
          { title: "Inset (content width)", value: "inset" },
          { title: "Full (wide)", value: "full" },
        ],
        layout: "radio",
      },
      initialValue: "inset",
    }),
  ],
  preview: {
    select: { media: "image", title: "image.alt" },
    prepare({ media, title }) {
      return { title: title || "Captioned figure", media };
    },
  },
});
