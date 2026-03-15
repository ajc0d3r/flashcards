import { LanguageCode } from "@/types/flashcard";

const GOOGLE_TTS_API_URL =
  "https://texttospeech.googleapis.com/v1/text:synthesize";

// Female WaveNet voices per language — warm, clear, toddler-friendly
const LANGUAGE_VOICE: Record<LanguageCode, { languageCode: string; name: string }> = {
  en: { languageCode: "en-US", name: "en-US-Neural2-F" },
  hi: { languageCode: "hi-IN", name: "hi-IN-Neural2-A" },
  zh: { languageCode: "cmn-CN", name: "cmn-CN-Wavenet-A" },
  ar: { languageCode: "ar-XA", name: "ar-XA-Wavenet-A" },
};

export async function generateToddlerAudioDataUrl(
  text: string,
  language: LanguageCode,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return null;
  }

  // Gentle pace for toddlers (Google TTS range: 0.25–4.0, where 1.0 is normal)
  const speakingRate = 0.6;

  const voice = LANGUAGE_VOICE[language];

  const response = await fetch(`${GOOGLE_TTS_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice,
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate,
        pitch: 2.0, // slightly elevated for a soft, warm tone
        volumeGainDb: 0.0,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google TTS error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as { audioContent: string };
  return `data:audio/mpeg;base64,${data.audioContent}`;
}
