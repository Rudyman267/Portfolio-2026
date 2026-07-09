import { defineArrayMember, defineField, defineType } from "sanity";
import { ImagesIcon } from "@sanity/icons";

export const imageGallery = defineType({
  name: "imageGallery",
  title: "Image Gallery",
  type: "object",
  icon: ImagesIcon,
  fields: [
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [defineArrayMember({ type: "imageWithAlt" })],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "layout",
      title: "Layout",
      type: "string",
      options: {
        list: [
          { title: "Grid", value: "grid" },
          { title: "Carousel", value: "carousel" },
          { title: "Masonry", value: "masonry" },
        ],
        layout: "radio",
      },
      initialValue: "grid",
    }),
    defineField({
      name: "columns",
      title: "Columns (grid/masonry)",
      type: "number",
      options: { list: [2, 3, 4] },
      initialValue: 2,
    }),
  ],
  preview: {
    select: { images: "images", layout: "layout" },
    prepare({ images, layout }) {
      const count = Array.isArray(images) ? images.length : 0;
      return {
        title: `Gallery (${count} image${count === 1 ? "" : "s"})`,
        subtitle: layout,
      };
    },
  },
});
