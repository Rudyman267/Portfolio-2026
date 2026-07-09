import { defineQuery } from "next-sanity";

// Reusable projection for images (asset ref + alt + caption + LQIP metadata).
const IMAGE_FIELDS = /* groq */ `
  ...,
  "lqip": asset->metadata.lqip,
  "dimensions": asset->metadata.dimensions
`;

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0]{
    title,
    tagline,
    email,
    resumeUrl,
    footerText,
    nav[]{ label, "href": href, isExternal },
    socials[]{ label, "href": href, isExternal },
    defaultSeo
  }
`);

export const PROFILE_QUERY = defineQuery(`
  *[_type == "profile"][0]{
    name,
    headline,
    portrait{ ${IMAGE_FIELDS} },
    bio,
    skills[]{ category, items },
    tools,
    experience[]{ role, company, period, summary },
    seo
  }
`);

// Card-level fields for the work grid and home.
const PROJECT_CARD = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  summary,
  year,
  context,
  tags,
  featured,
  accentColor,
  "cover": coalesce(thumbnail, coverImage){ ${IMAGE_FIELDS} }
`;

export const PROJECTS_QUERY = defineQuery(`
  *[_type == "project" && defined(slug.current)]
    | order(orderRank){
      ${PROJECT_CARD}
    }
`);

export const FEATURED_PROJECTS_QUERY = defineQuery(`
  *[_type == "project" && featured == true && defined(slug.current)]
    | order(orderRank){
      ${PROJECT_CARD}
    }
`);

export const PROJECT_SLUGS_QUERY = defineQuery(`
  *[_type == "project" && defined(slug.current)]{ "slug": slug.current }
`);

export const PROJECT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "project" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    summary,
    context,
    year,
    role,
    team,
    timeline,
    tags,
    accentColor,
    coverImage{ ${IMAGE_FIELDS} },
    metrics[]{ value, label, description },
    body[]{
      ...,
      _type == "imageWithAlt" => { ${IMAGE_FIELDS} },
      _type == "captionedFigure" => { ..., image{ ${IMAGE_FIELDS} } },
      _type == "fullBleedMedia" => { ..., image{ ${IMAGE_FIELDS} } },
      _type == "imageGallery" => { ..., images[]{ ${IMAGE_FIELDS} } },
      _type == "processStep" => { ..., media{ ${IMAGE_FIELDS} } }
    },
    seo,
    "next": nextProject->{
      title,
      "slug": slug.current,
      "cover": coalesce(thumbnail, coverImage){ ${IMAGE_FIELDS} }
    }
  }
`);
