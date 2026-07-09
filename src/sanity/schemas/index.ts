import type { SchemaTypeDefinition } from "sanity";

// Documents
import { siteSettings } from "./documents/siteSettings";
import { profile } from "./documents/profile";
import { project } from "./documents/project";

// Objects
import { link } from "./objects/link";
import { seo } from "./objects/seo";
import { imageWithAlt } from "./objects/imageWithAlt";
import { imageGallery } from "./objects/imageGallery";
import { videoEmbed } from "./objects/videoEmbed";
import { metricCallout } from "./objects/metricCallout";
import { quote } from "./objects/quote";
import { twoColumn } from "./objects/twoColumn";
import { fullBleedMedia } from "./objects/fullBleedMedia";
import { captionedFigure } from "./objects/captionedFigure";
import { processStep } from "./objects/processStep";
import { richContent } from "./objects/richContent";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Documents
    siteSettings,
    profile,
    project,
    // Objects
    link,
    seo,
    imageWithAlt,
    imageGallery,
    videoEmbed,
    metricCallout,
    quote,
    twoColumn,
    fullBleedMedia,
    captionedFigure,
    processStep,
    richContent,
  ],
};
