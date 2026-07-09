import { defineField, defineType } from "sanity";
import { PlayIcon } from "@sanity/icons";

export const videoEmbed = defineType({
  name: "videoEmbed",
  title: "Video",
  type: "object",
  icon: PlayIcon,
  fields: [
    defineField({
      name: "url",
      title: "Video URL (YouTube / Vimeo)",
      type: "url",
      description: "Leave empty if uploading a file instead.",
    }),
    defineField({
      name: "file",
      title: "Uploaded video file",
      type: "file",
      options: { accept: "video/*" },
    }),
    defineField({
      name: "poster",
      title: "Poster image",
      type: "imageWithAlt",
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
    }),
    defineField({
      name: "autoplay",
      title: "Autoplay (muted, loop)",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "caption", media: "poster" },
    prepare({ title, media }) {
      return { title: title || "Video", media };
    },
  },
});
