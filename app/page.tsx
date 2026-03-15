"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { CardGrid } from "@/components/CardGrid";
import { PaginationControls } from "@/components/PaginationControls";
import {
  PLACEHOLDER_IMAGE_HERO,
  PLACEHOLDER_IMAGE_THEME,
} from "@/lib/imagePlaceholders";
import { LANGUAGE_OPTIONS, DEFAULT_LANGUAGES } from "@/lib/languages";
import { buildDeckKey, buildAudioKey, buildImageKey } from "@/lib/storage/cacheKeys";
import {
  getCachedAudio,
  getCachedDeck,
  getCachedImage,
  setCachedAudio,
  setCachedDeck,
  setCachedImage,
} from "@/lib/storage/indexedDb";
import { THEME_OPTIONS } from "@/data/themes";
import {
  CustomWordInput,
  FlashcardCard,
  FlashcardDeck,
  GenerateAudioResponse,
  GenerateImageResponse,
  GenerateSetResponse,
  LanguageCode,
} from "@/types/flashcard";

const CARDS_PER_PAGE = 3;
type AppScreen = "welcome" | "themes" | "languages" | "cards";

const THEME_IMAGE_HINTS: Record<string, string> = {
  animals: "Cute smiling cartoon animal friends",
  transport: "Cute toddler bus and car cartoons",
  "house-items": "Cute house items in pastel style",
  fruits: "Cute fruit characters for toddlers",
  colors: "Cute pastel rainbow color shapes",
  custom: "Cute toddler storybook stars and clouds",
};
const HERO_IMAGE_HINT =
  "A single cute teddy bear for toddlers, pastel storybook style, warm and gentle";

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("animals");
  const [customThemeName, setCustomThemeName] = useState("");
  const [customWordsText, setCustomWordsText] = useState("");
  const [selectedLanguages, setSelectedLanguages] =
    useState<LanguageCode[]>(DEFAULT_LANGUAGES);
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingAudioKey, setLoadingAudioKey] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState(
    PLACEHOLDER_IMAGE_HERO,
  );
  const [themeImageUrls, setThemeImageUrls] = useState<Record<string, string>>({});
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [ttsApiUnavailable, setTtsApiUnavailable] = useState(false);

  const visibleCards = useMemo(() => {
    if (!deck) {
      return [];
    }
    const start = currentPageIndex * CARDS_PER_PAGE;
    return deck.cards.slice(start, start + CARDS_PER_PAGE);
  }, [currentPageIndex, deck]);
  const totalPages = Math.max(
    1,
    Math.ceil((deck?.cards.length ?? 0) / CARDS_PER_PAGE),
  );
  const selectedThemeLabel =
    THEME_OPTIONS.find((theme) => theme.id === selectedThemeId)?.label ??
    "Theme";

  useEffect(() => {
    void preloadEntryImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (screen !== "cards" || !deck || visibleCards.length === 0) {
      return;
    }
    let isCancelled = false;
    const start = currentPageIndex * CARDS_PER_PAGE;

    void loadImagesForCards(visibleCards, deck.themeId, () => isCancelled).then(
      (updatedCards) => {
        if (isCancelled || !updatedCards) {
          return;
        }
        setDeck((prev) => {
          if (!prev) {
            return prev;
          }
          const newCards = [...prev.cards];
          updatedCards.forEach((card, i) => {
            newCards[start + i] = card;
          });
          return { ...prev, cards: newCards };
        });
      },
    );

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, currentPageIndex, deck?.id]);

  useEffect(() => {
    if (screen !== "cards" || visibleCards.length === 0) {
      return;
    }
    let isCancelled = false;
    setIsPreparingAudio(true);
    void preloadVisibleAudio(visibleCards, selectedLanguages, () => isCancelled).finally(
      () => {
        if (!isCancelled) {
          setIsPreparingAudio(false);
        }
      },
    );
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, currentPageIndex, deck, selectedLanguages]);

  async function preloadEntryImages() {
    const [hero, ...themeResults] = await Promise.all([
      loadIllustration("welcome", HERO_IMAGE_HINT),
      ...THEME_OPTIONS.map((theme) =>
        loadIllustration(
          `theme-${theme.id}`,
          THEME_IMAGE_HINTS[theme.id] ?? `${theme.label} toddlers cartoon`,
        ),
      ),
    ]);

    if (hero) {
      setHeroImageUrl(hero);
    }

    const themeUrlMap: Record<string, string> = {};
    THEME_OPTIONS.forEach((theme, index) => {
      const imageUrl = themeResults[index];
      if (imageUrl) {
        themeUrlMap[theme.id] = imageUrl;
      }
    });
    setThemeImageUrls(themeUrlMap);
  }

  async function loadIllustration(
    themeId: string,
    englishWord: string,
  ): Promise<string | undefined> {
    const imageKey = buildImageKey(themeId, englishWord);
    const cachedImage = await getCachedImage(imageKey);
    if (cachedImage) {
      return cachedImage;
    }

    const response = await fetch("/api/generate-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        themeId,
        word: {
          en: englishWord,
          hi: englishWord,
          zh: englishWord,
          ar: englishWord,
        },
      }),
    });
    if (!response.ok) {
      return undefined;
    }
    const body = (await response.json()) as GenerateImageResponse;
    await setCachedImage(imageKey, body.imageUrl);
    return body.imageUrl;
  }

  async function handleGenerate() {
    try {
      setIsGenerating(true);
      setErrorMessage("");
      setTtsApiUnavailable(false);

      const customWords = parseCustomWords(customWordsText);
      if (selectedThemeId === "custom" && customWords.length === 0) {
        throw new Error(
          "Please add at least one custom word before generating cards.",
        );
      }

      const customFingerprint =
        selectedThemeId === "custom"
          ? `${customThemeName}:${customWordsText}`
          : "built-in";

      const deckCacheKey = buildDeckKey(
        selectedThemeId,
        selectedLanguages,
        customFingerprint,
      );
      const cachedDeck = await getCachedDeck(deckCacheKey);
      if (cachedDeck) {
        setDeck(cachedDeck);
        setCurrentPageIndex(0);
        setScreen("cards");
        return;
      }

      const response = await fetch("/api/generate-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId: selectedThemeId,
          customThemeName,
          customWords,
          languages: selectedLanguages,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not generate a card set.");
      }

      const body = (await response.json()) as GenerateSetResponse;
      const finalDeck = body.deck;

      await setCachedDeck(deckCacheKey, finalDeck);
      setDeck(finalDeck);
      setCurrentPageIndex(0);
      setScreen("cards");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function loadImagesForCards(
    cards: FlashcardCard[],
    themeId: string,
    isCancelled: () => boolean,
  ): Promise<FlashcardCard[] | null> {
    const results = await Promise.all(
      cards.map(async (card) => {
        if (card.imageUrl || isCancelled()) {
          return card;
        }
        const imageKey = buildImageKey(themeId, card.translations.en);
        const cachedImage = await getCachedImage(imageKey);
        if (cachedImage) {
          return { ...card, imageUrl: cachedImage };
        }

        const response = await fetch("/api/generate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            themeId,
            word: card.translations,
          }),
        });

        if (!response.ok) {
          return card;
        }
        const data = (await response.json()) as GenerateImageResponse;
        await setCachedImage(imageKey, data.imageUrl);
        return { ...card, imageUrl: data.imageUrl };
      }),
    );
    return isCancelled() ? null : results;
  }

  async function ensureAudioCached(
    card: FlashcardCard,
    language: LanguageCode,
    retryCount = 0,
  ): Promise<string | undefined> {
    const audioKey = buildAudioKey(card.translations.en, language);
    const cachedAudio = await getCachedAudio(audioKey);
    if (cachedAudio) {
      return cachedAudio;
    }

    const bundledAudio = card.audioUrls?.[language];
    if (bundledAudio) {
      await setCachedAudio(audioKey, bundledAudio);
      return bundledAudio;
    }

    if (deck?.source === "seeded") {
      return undefined;
    }

    if (ttsApiUnavailable) {
      return undefined;
    }

    const response = await fetch("/api/generate-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        englishWord: card.translations.en,
        text: card.translations[language],
        language,
      }),
    });
    if (!response.ok) {
      return undefined;
    }

    const body = (await response.json()) as GenerateAudioResponse;
    if (body.audioDataUrl) {
      await setCachedAudio(audioKey, body.audioDataUrl);
      return body.audioDataUrl;
    }

    const errorText = (body.error ?? "").toLowerCase();
    const isQuotaIssue = errorText.includes("quota");
    const isRateLimit = errorText.includes("429") || errorText.includes("rate");

    if (isQuotaIssue) {
      setTtsApiUnavailable(true);
      return undefined;
    }

    if (isRateLimit && retryCount < 1) {
      await sleep(350);
      return ensureAudioCached(card, language, retryCount + 1);
    }

    return undefined;
  }

  async function preloadVisibleAudio(
    cards: FlashcardCard[],
    languages: LanguageCode[],
    isCancelled: () => boolean,
  ): Promise<void> {
    for (const card of cards) {
      for (const language of languages) {
        if (isCancelled()) {
          return;
        }
        await ensureAudioCached(card, language);
        await sleep(100);
      }
    }
  }

  async function handlePlayAudio(card: FlashcardCard, language: LanguageCode) {
    const audioLoadingKey = `${card.id}:${language}`;
    try {
      setLoadingAudioKey(audioLoadingKey);
      const audioDataUrl = await ensureAudioCached(card, language);

      if (audioDataUrl) {
        const audio = new Audio(audioDataUrl);
        await audio.play();
        return;
      }

      await playBrowserFallbackVoice(card.translations[language], language);
    } finally {
      setLoadingAudioKey(null);
    }
  }

  function toggleLanguage(code: LanguageCode) {
    const exists = selectedLanguages.includes(code);
    if (exists) {
      setSelectedLanguages((current) => current.filter((item) => item !== code));
      return;
    }
    setSelectedLanguages((current) => [...current, code]);
  }

  function handleThemePick(themeId: string) {
    setSelectedThemeId(themeId);
    setErrorMessage("");
    setScreen("languages");
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50">
      <main className="mx-auto h-full w-full max-w-6xl p-3 md:p-5">
        {screen === "welcome" ? (
          <section className="flex h-full flex-col items-center justify-between rounded-3xl bg-white/80 p-4 text-center shadow-sm ring-1 ring-violet-100 md:p-8">
            <header className="space-y-2">
              <h1 className="storybook-title text-6xl font-extrabold leading-none md:text-7xl">
                First Words
              </h1>
              <p className="bubble-text text-2xl md:text-3xl">
                Tap start and learn with soft, happy flashcards.
              </p>
            </header>
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-violet-100">
              <img
                src={heroImageUrl}
                alt="Toddler-friendly First Words cartoon"
                className="h-[48vh] w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => setScreen("themes")}
              className="rounded-full bg-violet-500 px-14 py-4 text-4xl font-extrabold text-white shadow-md transition hover:bg-violet-600"
            >
              Start
            </button>
          </section>
        ) : null}

        {screen === "themes" ? (
          <section className="flex h-full flex-col gap-4 rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-violet-100 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="storybook-title-soft text-5xl font-extrabold">
                Pick a Theme
              </h2>
              <button
                type="button"
                onClick={() => setScreen("welcome")}
                className="bubble-text rounded-full border border-violet-200 bg-white px-6 py-2 text-xl font-bold"
              >
                Back
              </button>
            </div>
            <div className="grid flex-1 min-h-0 grid-cols-2 gap-3 md:grid-cols-3">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemePick(theme.id)}
                  className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-white p-3 text-center shadow-sm ring-1 ring-violet-100 transition hover:-translate-y-1 hover:ring-violet-300"
                >
                  <div className="h-24 w-full overflow-hidden rounded-2xl bg-violet-100 md:h-28">
                    <img
                      src={
                        themeImageUrls[theme.id] ??
                        PLACEHOLDER_IMAGE_THEME
                      }
                      alt={`${theme.label} theme`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="bubble-strong text-3xl font-extrabold md:text-4xl">
                    {theme.label}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {screen === "languages" ? (
          <section className="flex h-full flex-col gap-4 rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-violet-100 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="storybook-title-soft text-5xl font-extrabold">
                Choose Languages
              </h2>
              <button
                type="button"
                onClick={() => setScreen("themes")}
                className="bubble-text rounded-full border border-violet-200 bg-white px-6 py-2 text-xl font-bold"
              >
                Back
              </button>
            </div>

            <p className="bubble-text text-2xl">
              Theme:
              {" "}
              <span className="bubble-strong font-extrabold">{selectedThemeLabel}</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              {LANGUAGE_OPTIONS.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => toggleLanguage(language.code)}
                  className={`rounded-3xl border p-4 text-center transition ${
                    selectedLanguages.includes(language.code)
                      ? "border-violet-500 bg-violet-600 text-white"
                      : "border-violet-200 bg-white text-violet-800"
                  }`}
                >
                  <p className="text-4xl font-extrabold md:text-5xl">{language.nativeLabel}</p>
                  <p className="text-xl font-bold opacity-90">{language.label}</p>
                </button>
              ))}
            </div>

            {selectedThemeId === "custom" ? (
              <div className="space-y-2 rounded-2xl bg-violet-50 p-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-violet-900">
                    Custom Theme Name
                  </span>
                  <input
                    value={customThemeName}
                    onChange={(event) => setCustomThemeName(event.target.value)}
                    placeholder="My Family Words"
                    className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-violet-900 outline-none focus:border-violet-500"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-violet-900">
                    Custom Words
                  </span>
                  <textarea
                    value={customWordsText}
                    onChange={(event) => setCustomWordsText(event.target.value)}
                    placeholder="cat|बिल्ली|猫|قطة, moon|चाँद|月亮|قمر"
                    className="h-20 rounded-xl border border-violet-200 bg-white px-3 py-2 text-violet-900 outline-none focus:border-violet-500"
                  />
                </label>
              </div>
            ) : null}

            {errorMessage ? (
              <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isGenerating || selectedLanguages.length === 0}
              className="mt-auto rounded-full bg-violet-500 px-10 py-4 text-3xl font-extrabold text-white shadow-md transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate First 3 Cards"}
            </button>
          </section>
        ) : null}

        {screen === "cards" && deck ? (
          <section className="flex h-full min-h-0 flex-col gap-3 rounded-3xl bg-white/80 p-3 shadow-sm ring-1 ring-violet-100 md:p-4">
            <div className="flex items-center justify-between">
              <p className="storybook-title-soft text-center text-2xl font-extrabold md:text-3xl">
                {selectedThemeLabel}
              </p>
              <button
                type="button"
                onClick={() => setScreen("languages")}
                className="bubble-text rounded-full border border-violet-200 bg-white px-6 py-2 text-xl font-bold"
              >
                Back
              </button>
            </div>

            {isPreparingAudio ? (
              <p className="rounded-xl bg-violet-50 px-3 py-2 text-center text-sm font-bold text-violet-800">
                Preparing audio for this page...
              </p>
            ) : null}
            {ttsApiUnavailable ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-sm font-bold text-amber-800">
                Google TTS is currently unavailable; using device voice fallback.
              </p>
            ) : null}

            <PaginationControls
              currentSetIndex={currentPageIndex}
              totalSets={totalPages}
              onPrevious={() =>
                setCurrentPageIndex((value) => Math.max(0, value - 1))
              }
              onNext={() =>
                setCurrentPageIndex((value) => Math.min(totalPages - 1, value + 1))
              }
            />

            <div className="flex-1 min-h-0">
              <CardGrid
                cards={visibleCards}
                selectedLanguages={selectedLanguages}
                loadingAudioKey={loadingAudioKey}
                onPlayAudio={handlePlayAudio}
              />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function parseCustomWords(value: string): CustomWordInput[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [en, hi, zh, ar] = item.split("|").map((part) => part.trim());
      return { en, hi, zh, ar };
    })
    .filter((word) => Boolean(word.en));
}

async function playBrowserFallbackVoice(
  text: string,
  language: LanguageCode,
): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  const synth = window.speechSynthesis;
  const voices = await getSpeechVoices(synth);

  const locale: Record<LanguageCode, string> = {
    en: "en-US",
    hi: "hi-IN",
    zh: "zh-CN",
    ar: "ar-SA",
  };
  const prefix: Record<LanguageCode, string> = {
    en: "en",
    hi: "hi",
    zh: "zh",
    ar: "ar",
  };

  const preferredVoice = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(prefix[language]),
  );

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = preferredVoice?.lang ?? locale[language];
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  utterance.rate = 0.6;
  utterance.pitch = 1.02;
  utterance.volume = 0.95;

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 5000);
    utterance.onend = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    utterance.onerror = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    synth.cancel();
    synth.speak(utterance);
  });
}

function getSpeechVoices(
  synth: SpeechSynthesis,
): Promise<SpeechSynthesisVoice[]> {
  const immediate = synth.getVoices();
  if (immediate.length > 0) {
    return Promise.resolve(immediate);
  }

  return new Promise((resolve) => {
    const onVoicesChanged = () => {
      const loadedVoices = synth.getVoices();
      if (loadedVoices.length > 0) {
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(loadedVoices);
      }
    };
    synth.addEventListener("voiceschanged", onVoicesChanged);
    window.setTimeout(() => {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(synth.getVoices());
    }, 1200);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
