import { defineField, defineType, defineArrayMember } from "sanity";
import { SplitHorizontalIcon } from "@sanity/icons";

const columnContent = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "array",
    of: [
      defineArrayMember({ type: "block" }),
      defineArrayMember({ type: "imageWithAlt" }),
      defineArrayMember({ type: "metricCallout" }),
    ],
  });

export const twoColumn = defineType({
  name: "twoColumn",
  title: "Two Columns",
  type: "object",
  icon: SplitHorizontalIcon,
  fields: [
    columnContent("left", "Left column"),
    columnContent("right", "Right column"),
    defineField({
      name: "ratio",
      title: "Column ratio",
      type: "string",
      options: {
        list: [
          { title: "50 / 50", value: "1-1" },
          { title: "60 / 40", value: "3-2" },
          { title: "40 / 60", value: "2-3" },
        ],
        layout: "radio",
      },
      initialValue: "1-1",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Two columns" };
    },
  },
});
