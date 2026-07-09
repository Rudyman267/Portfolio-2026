import { defineArrayMember, defineType } from "sanity";

/**
 * The flexible per-project case-study canvas. Narrative-heavy projects use
 * mostly text blocks; visual-heavy projects drop in galleries, full-bleed
 * media, and figures in any order.
 */
export const richContent = defineType({
  name: "richContent",
  title: "Content",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading", value: "h2" },
        { title: "Subheading", value: "h3" },
        { title: "Small heading", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
          { title: "Code", value: "code" },
        ],
        annotations: [{ type: "link" }],
      },
    }),
    defineArrayMember({ type: "imageWithAlt" }),
    defineArrayMember({ type: "imageGallery" }),
    defineArrayMember({ type: "videoEmbed" }),
    defineArrayMember({ type: "metricCallout" }),
    defineArrayMember({ type: "quote" }),
    defineArrayMember({ type: "twoColumn" }),
    defineArrayMember({ type: "fullBleedMedia" }),
    defineArrayMember({ type: "captionedFigure" }),
    defineArrayMember({ type: "processStep" }),
  ],
});
