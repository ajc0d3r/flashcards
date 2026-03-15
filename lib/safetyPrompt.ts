import { LanguageCode, WordTranslations } from "@/types/flashcard";

export const TODDLER_SAFETY_TENET =
  "All visuals, words, and voices must be soft, gentle, calm, and toddler-friendly. Avoid scary, violent, sharp, loud, or age-inappropriate content.";

export const STYLE_VERSION = "v4-soft-gentle-single-object-no-text-guarded";

export function createToddlerImagePrompt(
  themeId: string,
  word: WordTranslations,
): string {
  const isCardTheme = !themeId.startsWith("theme-") && themeId !== "welcome";
  const compositionRule = isCardTheme
    ? [
        "Show exactly one main object only (one fruit, one animal, one vehicle, etc.).",
        "Do not show multiple copies, groups, baskets, collages, or repeated items.",
        "If the word is plural, still illustrate one representative item only.",
        "The main object must occupy at least 70% of the frame area.",
        "Keep one centered subject with clean empty space around it.",
      ]
    : [
        "Create one cheerful toddler-friendly scene for this screen with simple composition.",
        "The main character or subject should occupy at least 70% of the frame area.",
        "Avoid busy or crowded details.",
      ];

  return [
    `Create a single flashcard illustration for toddlers for the word "${word.en}" in the "${themeId}" theme.`,
    "Illustration mode: clean storybook icon style with one clear subject and minimal background props.",
    "Style: soft pastel colors, friendly rounded shapes, warm light, simple composition, no background clutter.",
    "Mood: calm, cheerful, gentle, and safe for very young children.",
    ...compositionRule,
    "Absolutely no text of any kind: no words, no letters, no numbers, no labels, no captions.",
    "No logos, no watermark, no signage, no symbols that resemble writing.",
    "Do not draw book covers, signs, posters, labels, package text, brand marks, or UI text overlays.",
    "No scary elements, no violence.",
    TODDLER_SAFETY_TENET,
  ].join(" ");
}

export function createToddlerTtsInstruction(language: LanguageCode): string {
  const languageHint: Record<LanguageCode, string> = {
    en: "Speak in clear and simple English.",
    hi: "Speak in clear and simple Hindi.",
    zh: "Speak in clear and simple Mandarin Chinese.",
    ar: "Speak in clear and simple Arabic.",
  };

  return [
    "Use a soft, warm, patient, female-presenting, toddler-friendly voice.",
    "Speak slowly and clearly with a calm and soothing tone.",
    "Keep speech energy focused in the core speech range (about 250 Hz to 4000 Hz), with especially clear consonant cues around 2000 Hz to 4000 Hz.",
    "Avoid harsh brightness or hiss in the upper range (roughly above 5000 Hz) and avoid boomy low bass (roughly below 200 Hz).",
    "Keep loudness gentle and consistent; never shout or sound excited.",
    "Do not add extra words beyond the card text.",
    languageHint[language],
    TODDLER_SAFETY_TENET,
  ].join(" ");
}
