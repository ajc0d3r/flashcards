import { LanguageCode } from "@/types/flashcard";

export const LANGUAGE_OPTIONS: Array<{
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}> = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
];

export const DEFAULT_LANGUAGES: LanguageCode[] = ["en", "hi"];
