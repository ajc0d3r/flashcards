"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { PLACEHOLDER_IMAGE_SQUARE } from "@/lib/imagePlaceholders";
import { FlashcardCard, LanguageCode } from "@/types/flashcard";
import { LANGUAGE_OPTIONS } from "@/lib/languages";

interface FlashcardProps {
  card: FlashcardCard;
  selectedLanguages: LanguageCode[];
  isAudioLoading: boolean;
  onPlayAudio: (card: FlashcardCard, language: LanguageCode) => Promise<void>;
}

export function Flashcard({
  card,
  selectedLanguages,
  isAudioLoading,
  onPlayAudio,
}: FlashcardProps) {
  const [frontLanguageIndex, setFrontLanguageIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const activeLanguage = useMemo(() => {
    if (selectedLanguages.length === 0) {
      return "en";
    }
    return selectedLanguages[frontLanguageIndex % selectedLanguages.length];
  }, [frontLanguageIndex, selectedLanguages]);

  const nextLanguage = useMemo(() => {
    if (selectedLanguages.length <= 1) {
      return activeLanguage;
    }
    return selectedLanguages[(frontLanguageIndex + 1) % selectedLanguages.length];
  }, [activeLanguage, frontLanguageIndex, selectedLanguages]);

  const activeWord = card.translations[activeLanguage];
  const activeLanguageLabel =
    LANGUAGE_OPTIONS.find((item) => item.code === activeLanguage)?.label ??
    activeLanguage.toUpperCase();
  const nextWord = card.translations[nextLanguage];
  const nextLanguageLabel =
    LANGUAGE_OPTIONS.find((item) => item.code === nextLanguage)?.label ??
    nextLanguage.toUpperCase();
  const activeDirection = activeLanguage === "ar" ? "rtl" : "ltr";
  const nextDirection = nextLanguage === "ar" ? "rtl" : "ltr";

  function handleFlip() {
    if (selectedLanguages.length <= 1 || isFlipped || isResetting) {
      return;
    }
    setIsFlipped(true);
  }

  return (
    <div className="h-full min-h-0 rounded-3xl bg-white/95 p-2 shadow-sm ring-1 ring-violet-100 [perspective:1200px]">
      <motion.div
        role="button"
        tabIndex={0}
        onClick={handleFlip}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleFlip();
          }
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        onAnimationComplete={() => {
          if (selectedLanguages.length <= 1) {
            return;
          }
          if (isFlipped) {
            setIsResetting(true);
            setFrontLanguageIndex(
              (value) => (value + 1) % selectedLanguages.length,
            );
            setIsFlipped(false);
            return;
          }
          if (isResetting) {
            setIsResetting(false);
          }
        }}
        transition={{
          duration: isResetting ? 0 : 0.55,
          ease: "easeInOut",
        }}
        className="relative h-full w-full rounded-2xl text-left [transform-style:preserve-3d]"
      >
        <div className="absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-2xl bg-violet-50 [backface-visibility:hidden]">
          <div className="relative h-[45%] min-h-20 w-full overflow-hidden rounded-b-2xl bg-violet-100">
            <img
              src={card.imageUrl || PLACEHOLDER_IMAGE_SQUARE}
              alt={card.translations.en}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex min-h-[30%] flex-1 flex-col justify-between gap-2 p-3">
            <p className="bubble-text text-base font-bold">
              {activeLanguageLabel}
            </p>
            <p
              dir={activeDirection}
              className="bubble-strong line-clamp-2 text-[clamp(1.25rem,3.1vw,2.8rem)] font-extrabold leading-tight"
            >
              {activeWord}
            </p>
            <div className="flex items-end justify-between">
              <span className="bubble-text text-xs">
                Tap card to flip language
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void onPlayAudio(card, activeLanguage);
                }}
                disabled={isAudioLoading}
                className="rounded-full bg-violet-500 px-3 py-1.5 text-xl text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Play ${card.translations.en} in ${activeLanguageLabel}`}
              >
                {isAudioLoading ? "..." : "🔊"}
              </button>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-2xl bg-violet-50 [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <div className="relative h-[45%] min-h-20 w-full overflow-hidden rounded-b-2xl bg-violet-100">
            <img
              src={card.imageUrl || PLACEHOLDER_IMAGE_SQUARE}
              alt={card.translations.en}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex min-h-[30%] flex-1 flex-col justify-between gap-2 p-3">
            <p className="bubble-text text-base font-bold">
              {nextLanguageLabel}
            </p>
            <p
              dir={nextDirection}
              className="bubble-strong line-clamp-2 text-[clamp(1.25rem,3.1vw,2.8rem)] font-extrabold leading-tight"
            >
              {nextWord}
            </p>
            <div className="flex items-end justify-between">
              <span className="bubble-text text-xs">
                Tap card to flip language
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void onPlayAudio(card, nextLanguage);
                }}
                disabled={isAudioLoading}
                className="rounded-full bg-violet-500 px-3 py-1.5 text-xl text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Play ${card.translations.en} in ${nextLanguageLabel}`}
              >
                {isAudioLoading ? "..." : "🔊"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
