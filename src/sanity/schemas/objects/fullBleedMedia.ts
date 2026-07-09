import { defineField, defineType } from "sanity";
import { ExpandIcon } from "@sanity/icons";

export const fullBleedMedia = defineType({
  name: "fullBleedMedia",
  title: "Full-bleed Media",
  type: "object",
  icon: ExpandIcon,
  fields: [
    defineField({
      name: "mediaType",
      title: "Media type",
      type: "string",
      options: {
        list: [
          { title: "Image", value: "image" },
          { title: "Video", value: "video" },
        ],
        layout: "radio",
      },
      initialValue: "image",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "imageWithAlt",
      hidden: ({ parent }) => parent?.mediaType === "video",
    }),
    defineField({
      name: "video",
      title: "Video",
      type: "videoEmbed",
      hidden: ({ parent }) => parent?.mediaType !== "video",
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
    }),
    defineField({
      name: "parallax",
      title: "Parallax effect",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { media: "image", caption: "caption" },
    prepare({ media, caption }) {
      return { title: caption || "Full-bleed media", media };
    },
  },
});
