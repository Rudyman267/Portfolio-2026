import { defineField, defineType } from "sanity";
import { LinkIcon } from "@sanity/icons";

export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
    }),
    defineField({
      name: "href",
      title: "URL",
      type: "url",
      validation: (rule) =>
        rule
          .required()
          .uri({ allowRelative: true, scheme: ["http", "https", "mailto", "tel"] }),
    }),
    defineField({
      name: "isExternal",
      title: "Open in new tab",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
