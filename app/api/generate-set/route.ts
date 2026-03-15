import { NextRequest, NextResponse } from "next/server";
import { BUILT_IN_THEME_IDS } from "@/data/themes";
import { buildDeckFromRequest } from "@/lib/deckBuilder";
import { loadSeededDeckForTheme } from "@/lib/server/catalogDeck";
import { GenerateSetRequest, LanguageCode } from "@/types/flashcard";

const ALLOWED_LANGUAGES: LanguageCode[] = ["en", "hi", "zh", "ar"];

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as GenerateSetRequest;
    if (!payload?.themeId) {
      return NextResponse.json(
        { error: "themeId is required." },
        { status: 400 },
      );
    }

    const safeLanguages = (payload.languages ?? []).filter(
      (language): language is LanguageCode =>
        ALLOWED_LANGUAGES.includes(language as LanguageCode),
    );
    const selectedLanguages: LanguageCode[] =
      safeLanguages.length > 0 ? safeLanguages : ["en", "hi"];

    if (BUILT_IN_THEME_IDS.includes(payload.themeId)) {
      const seededDeck = loadSeededDeckForTheme(payload.themeId, selectedLanguages);
      if (seededDeck) {
        return NextResponse.json({ deck: seededDeck });
      }
    }

    const deck = buildDeckFromRequest({
      ...payload,
      languages: selectedLanguages,
    });

    return NextResponse.json({ deck });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate flashcards.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
