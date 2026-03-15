# Flashcards For Toddlers

Browser-based toddler flashcards with multilingual support, gentle generated images, and soft voice playback.

## Features

- Themes: animals, transport, house items, fruits, colors, and custom.
- Languages: English, Hindi, Chinese, Arabic.
- Generates 9 cards per deck, shown as 3 sets of 3 cards.
- Tap cards to flip and cycle language display.
- Speaker icon plays audio only on click (no autoplay).
- Local IndexedDB cache for decks, images, and audio to reduce regeneration.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template and fill keys:

```bash
cp .env.example .env.local
```

3. Run development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

- `FAL_KEY`: fal.ai API key for image generation.
- `FAL_IMAGE_MODEL`: fal model endpoint (default `fal-ai/flux/schnell`).
- `FAL_IMAGE_MAX_ATTEMPTS`: number of retries for no-text enforcement (default `3`).
- `OPENAI_API_KEY`: OpenAI API key for TTS.
- `OPENAI_TTS_MODEL`: OpenAI TTS model (default `gpt-4o-mini-tts`).
- `OPENAI_TTS_VOICE`: OpenAI voice name (default `shimmer`, tuned for gentle female-presenting delivery).
- `OPENAI_TTS_SPEED`: TTS playback speed (default `0.82` for calmer toddler pacing).
- `OPENAI_IMAGE_GUARD_MODEL`: optional vision model used to reject generated images that contain visible text (default `gpt-4o-mini`).

## Commands

- `npm run dev` - run the local dev app.
- `npm run lint` - run ESLint.
- `npm run test` - run smoke tests.
- `npm run seed:catalog` - one-time generate and store built-in assets into local DB + files.
- `npm run seed:catalog:files` - DB-only seed from existing files under `public/seed`.

## Built-In Catalog (No Runtime API)

Built-in themes (`animals`, `transport`, `house-items`, `fruits`, `colors`) can be served from a local SQLite catalog and local static assets:

- DB file: `storage/catalog.db`
- Images: `public/seed/images/<themeId>/...`
- Audio: `public/seed/audio/<themeId>/...`

Flow:

1. Run `npm run seed:catalog` once (uses FAL/OpenAI to generate and save).
2. App reads built-in cards from local catalog in `app/api/generate-set/route.ts`.
3. Built-in cards use saved image/audio URLs, so runtime API calls are skipped.
4. `custom` theme continues using AI generation.

## Safety Rule

See `AGENT.md` for the non-negotiable safety tenet that all content must remain soft, gentle, and toddler-friendly.
