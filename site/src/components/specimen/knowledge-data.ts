// Knowledge module + resource tile data copied from the harvested
// fonts.google.com snapshots (.cache/research/ref). Cards deep-link to the
// live fonts.google.com knowledge articles.
import type { KnowledgeCard } from "./common";

const GF = "https://fonts.google.com";
const IMG = "https://fonts.gstatic.com/s/img/knowledge/modules";

function lessonCard(
  module: string,
  slug: string,
  title: string,
  thumb: string,
): KnowledgeCard {
  return {
    title,
    href: `${GF}/knowledge/${module}/${slug}`,
    image: `${IMG}/${module}/lessons/${slug}/images/thumbnail_${thumb}.svg`,
  };
}

export const choosingTypeDescription =
  "When you have some text, how can you choose a typeface? Many people—professional designers included—go through an app’s font menu until we find one we like. This module shows that there are many considerations that can improve our type choices. By setting some useful constraints to aid our type selection, we can also develop a critical eye for analyzing type along the way.";

export const choosingTypeHref = `${GF}/knowledge/choosing_type`;

export const choosingTypeCards: KnowledgeCard[] = [
  lessonCard(
    "choosing_type",
    "choosing_web_fonts_beginners_guide",
    "Choosing web fonts: A beginner's all-in-one guide",
    "695469504",
  ),
  lessonCard(
    "choosing_type",
    "a_checklist_for_choosing_type",
    "A checklist for choosing type",
    "439626857",
  ),
  lessonCard(
    "choosing_type",
    "emotive_considerations_for_choosing_typefaces",
    "Emotive considerations for choosing typefaces",
    "411126311",
  ),
  lessonCard(
    "choosing_type",
    "choosing_reliable_typefaces",
    "Choosing reliable typefaces",
    "411126311",
  ),
  lessonCard(
    "choosing_type",
    "exploring_typefaces_with_multiple_weights_or_grades",
    "Exploring typefaces with multiple weights or grades",
    "411126311",
  ),
  lessonCard(
    "choosing_type",
    "exploring_width_in_type",
    "Exploring width in type",
    "411126311",
  ),
  lessonCard(
    "choosing_type",
    "choosing_typefaces_that_have_optical_sizes",
    "Choosing typefaces that have optical sizes",
    "439626857",
  ),
  lessonCard(
    "choosing_type",
    "pairing_typefaces",
    "Pairing typefaces",
    "411126311",
  ),
  lessonCard(
    "choosing_type",
    "pairing_typefaces_within_a_family_superfamily",
    "Pairing typefaces within a family & superfamily",
    "411126311",
  ),
  lessonCard(
    "choosing_type",
    "pairing_typefaces_by_the_same_type_designer_or_type_foundry",
    "Pairing typefaces by the same type designer or type foundry",
    "411126311",
  ),
  {
    ...lessonCard(
      "choosing_type",
      "pairing_typefaces_based_on_their_construction_using_the_font_matrix",
      "Pairing typefaces using the font matrix",
      "491952163",
    ),
  },
  lessonCard(
    "choosing_type",
    "exploring_x_height_the_em_square",
    "Exploring x-height & the em square",
    "411126311",
  ),
  lessonCard(
    "choosing_type",
    "adding_fonts_to_google_docs",
    "Adding fonts to documents and slides",
    "522427281",
  ),
];

// ---------------------------------------------------------------------------
// Embed page "Develop in web" / "Web performance" modules.

export const developInWebDescription =
  "Learn all about how to implement font using the API CSS code. A web font is any font used in a website’s design that isn’t installed by default on the end user’s device—a counterpart to a system font. Check out the articles below for more guidance:";

export const developInWebHref = `${GF}/knowledge/using_type`;

export const developInWebCards: KnowledgeCard[] = [
  lessonCard("using_type", "using_web_fonts", "Using web fonts", "411126311"),
  lessonCard(
    "using_type",
    "the_foundations_of_web_typography",
    "The foundations of web typography",
    "439626857",
  ),
  lessonCard(
    "using_type",
    "using_web_fonts_from_a_font_delivery_service",
    "Using web fonts from a font delivery service",
    "411126311",
  ),
  lessonCard(
    "using_type",
    "self_hosting_web_fonts",
    "Self-hosting web fonts",
    "411126311",
  ),
];

export const webPerformanceDescription =
  "Font loading times are increasingly crucial, impacting page rankings and visitor experiences. Learn how to optimize your font performance and enhance overall web page quality.";

export const webPerformanceCards: KnowledgeCard[] = [
  {
    title: "Reduce reflow with web fonts",
    href: "https://material.io/blog/reduce-reflow-with-web-fonts",
    image:
      "https://www.gstatic.com/images/icons/material/apps/fonts/1x/catalog/checkout/reflow.jpg",
  },
  lessonCard(
    "using_type",
    "loading_variable_fonts_on_the_web",
    "Loading variable fonts on the web",
    "411126311",
  ),
  lessonCard(
    "using_type",
    "styling_type_on_the_web_with_variable_fonts",
    "Styling type on the web with variable fonts",
    "411126311",
  ),
];

// ---------------------------------------------------------------------------
// Selection page "How to use" resource tiles.

export type ResourceTile = {
  title: string;
  href: string;
  image: string;
  description: string;
  categories: Array<"Design" | "Develop" | "Tools">;
  knowledge?: boolean;
};

const CHECKOUT_IMG =
  "https://www.gstatic.com/images/icons/material/apps/fonts/1x/catalog/checkout";

export const howToUseChips = ["All", "Design", "Develop", "Tools"];

export const howToUseTiles: ResourceTile[] = [
  {
    title: "Installing & managing fonts—including variable fonts",
    href: `${GF}/knowledge/using_type/installing_and_managing_fonts`,
    image: `${IMG}/using_type/lessons/installing_and_managing_fonts/images/thumbnail_462178341.svg`,
    description:
      "Building and maintaining a font collection on the computer you use for design work is an important part of life as a designer. However, there are a number of ways this process can be optimized—primarily by understanding where font files live, but also by proactively organizing your collection with font management software.",
    categories: ["Design"],
    knowledge: true,
  },
  {
    title: "Designing with variable fonts in desktop apps",
    href: `${GF}/knowledge/using_type/designing_with_variable_fonts_in_desktop_apps`,
    image: `${IMG}/using_type/lessons/designing_with_variable_fonts_in_desktop_apps/images/thumbnail_411126311.svg`,
    description:
      "Most desktop design apps’ implementation of variable fonts is fairly consistent, even across different developers.",
    categories: ["Design"],
    knowledge: true,
  },
  {
    title: "The foundations of web typography",
    href: `${GF}/knowledge/using_type/the_foundations_of_web_typography`,
    image: `${IMG}/using_type/lessons/the_foundations_of_web_typography/images/thumbnail_439626857.svg`,
    description:
      "An absolute beginner’s guide to setting type on the web, from CSS basics to implementing web fonts.",
    categories: ["Develop"],
    knowledge: true,
  },
  {
    title: "Self-hosting web fonts",
    href: `${GF}/knowledge/using_type/self_hosting_web_fonts`,
    image: `${IMG}/using_type/lessons/self_hosting_web_fonts/images/thumbnail_411126311.svg`,
    description:
      "It can sometimes be preferable to host the web fonts you use on your own server, and not all fonts are available on a font delivery service.",
    categories: ["Develop"],
    knowledge: true,
  },
  {
    title: "Loading variable fonts on the web",
    href: `${GF}/knowledge/using_type/loading_variable_fonts_on_the_web`,
    image: `${IMG}/using_type/lessons/loading_variable_fonts_on_the_web/images/thumbnail_411126311.svg`,
    description:
      "Using a variable font on our website is straightforward, but let’s break down each step in the process so we can see how it differs from using traditional web fonts.",
    categories: ["Develop"],
    knowledge: true,
  },
  {
    title: "Adding fonts to documents and slides",
    href: `${GF}/knowledge/choosing_type/adding_fonts_to_google_docs`,
    image: `${IMG}/choosing_type/lessons/adding_fonts_to_google_docs/images/thumbnail_522427281.svg`,
    description:
      "Document and presentation apps often include a selection of typefaces in the Font menu. Learn how to choose and manage fonts for writing, decks, and shared documents.",
    categories: ["Tools"],
    knowledge: true,
  },
  {
    title: "Typography systems",
    href: "https://m3.material.io/styles/typography/overview",
    image: `${CHECKOUT_IMG}/material_design.svg`,
    description:
      "Use typography to make writing legible and beautiful. A type scale with contrasting and flexible styles supports a wide range of use cases.",
    categories: ["Design", "Tools"],
  },
  {
    title: "Figma font pairings",
    href: "https://www.figma.com/google-fonts",
    image: `${CHECKOUT_IMG}/figma_font_pairing.jpg`,
    description:
      "Explore practical font pairings and start using them in your design projects. Strong pairings help establish tone, hierarchy, and rhythm.",
    categories: ["Design"],
  },
  {
    title: "You Asked for it—Here Are Some of Our Favorite Font Pairings",
    href: "https://material.io/blog/google-fonts-pairing-figma",
    image: `${CHECKOUT_IMG}/font_pairing.jpg`,
    description:
      "No matter what kind of project you're working on or where you are in the world, everyone should have access to stylish, high-quality fonts. That's why...",
    categories: ["Design"],
  },
  {
    title: "Web design tools",
    href: "https://support.google.com/webdesigner/answer/6163074?hl=en#add-google-fonts",
    image: `${CHECKOUT_IMG}/google_web.png`,
    description:
      "Many web design tools let you select fonts from common system families, hosted web fonts, or self-hosted font files.",
    categories: ["Tools"],
  },
  {
    title: "How to Reduce Layout Reflow When Using Web Fonts",
    href: "https://material.io/blog/reduce-reflow-with-web-fonts",
    image: `${CHECKOUT_IMG}/reflow.jpg`,
    description:
      "Font loading times are becoming more important than ever because they can influence page performance, layout stability, and visitor experience.",
    categories: ["Develop"],
  },
  {
    title: "Using Noto across writing tools",
    href: "https://blog.google/products/workspace/how-to-find-noto-in-google-docs-slides-sheets-and-sites/",
    image: `${CHECKOUT_IMG}/noto_blog.svg`,
    description:
      "Noto supports thousands of languages, making it a useful family for documents, presentations, spreadsheets, and multilingual publishing workflows.",
    categories: ["Tools"],
  },
];
