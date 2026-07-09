import { defineField, defineType } from "sanity";
import { TrendUpwardIcon } from "@sanity/icons";

export const metricCallout = defineType({
  name: "metricCallout",
  title: "Metric",
  type: "object",
  icon: TrendUpwardIcon,
  fields: [
    defineField({
      name: "value",
      title: "Value",
      type: "string",
      description: 'e.g. "3×", "40%", "12k"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: 'e.g. "faster shipping"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: { value: "value", label: "label" },
    prepare({ value, label }) {
      return { title: `${value} ${label}` };
    },
  },
});
