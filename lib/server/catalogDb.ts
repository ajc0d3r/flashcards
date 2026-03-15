import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { FlashcardCard, LanguageCode, WordTranslations } from "@/types/flashcard";

interface CatalogCardRow {
  id: string;
  theme_id: string;
  sort_order: number;
  en: string;
  hi: string;
  zh: string;
  ar: string;
  image_url: string;
}

interface CatalogAudioRow {
  card_id: string;
  language: LanguageCode;
  audio_url: string;
}

let database: Database.Database | null = null;

function getDb(): Database.Database {
  if (database) {
    return database;
  }

  const storageDir = path.join(process.cwd(), "storage");
  fs.mkdirSync(storageDir, { recursive: true });
  const dbPath = path.join(storageDir, "catalog.db");
  database = new Database(dbPath);
  database.pragma("journal_mode = WAL");

  database.exec(`
    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      is_built_in INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      theme_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      en TEXT NOT NULL,
      hi TEXT NOT NULL,
      zh TEXT NOT NULL,
      ar TEXT NOT NULL,
      image_url TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(theme_id) REFERENCES themes(id)
    );

    CREATE TABLE IF NOT EXISTS card_audio (
      card_id TEXT NOT NULL,
      language TEXT NOT NULL,
      audio_url TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(card_id, language),
      FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cards_theme_sort
      ON cards(theme_id, sort_order);

    CREATE INDEX IF NOT EXISTS idx_audio_card
      ON card_audio(card_id);
  `);

  return database;
}

export function upsertTheme(
  id: string,
  label: string,
  isBuiltIn = true,
): void {
  const db = getDb();
  const statement = db.prepare(`
    INSERT INTO themes (id, label, is_built_in, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      is_built_in = excluded.is_built_in,
      updated_at = excluded.updated_at
  `);
  statement.run(id, label, isBuiltIn ? 1 : 0, new Date().toISOString());
}

export function upsertCard(input: {
  id: string;
  themeId: string;
  sortOrder: number;
  translations: WordTranslations;
  imageUrl: string;
}): void {
  const db = getDb();
  const statement = db.prepare(`
    INSERT INTO cards (id, theme_id, sort_order, en, hi, zh, ar, image_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      theme_id = excluded.theme_id,
      sort_order = excluded.sort_order,
      en = excluded.en,
      hi = excluded.hi,
      zh = excluded.zh,
      ar = excluded.ar,
      image_url = excluded.image_url,
      updated_at = excluded.updated_at
  `);
  statement.run(
    input.id,
    input.themeId,
    input.sortOrder,
    input.translations.en,
    input.translations.hi,
    input.translations.zh,
    input.translations.ar,
    input.imageUrl,
    new Date().toISOString(),
  );
}

export function upsertCardAudio(
  cardId: string,
  language: LanguageCode,
  audioUrl: string,
): void {
  const db = getDb();
  const statement = db.prepare(`
    INSERT INTO card_audio (card_id, language, audio_url, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(card_id, language) DO UPDATE SET
      audio_url = excluded.audio_url,
      updated_at = excluded.updated_at
  `);
  statement.run(cardId, language, audioUrl, new Date().toISOString());
}

export function getCardsForTheme(themeId: string): FlashcardCard[] {
  const db = getDb();
  const cardRows = db
    .prepare(
      `
      SELECT id, theme_id, sort_order, en, hi, zh, ar, image_url
      FROM cards
      WHERE theme_id = ?
      ORDER BY sort_order ASC
    `,
    )
    .all(themeId) as CatalogCardRow[];

  if (cardRows.length === 0) {
    return [];
  }

  const placeholders = cardRows.map(() => "?").join(",");
  const audioRows = db
    .prepare(
      `
      SELECT card_id, language, audio_url
      FROM card_audio
      WHERE card_id IN (${placeholders})
    `,
    )
    .all(...cardRows.map((row) => row.id)) as CatalogAudioRow[];

  const audioByCardId = new Map<string, Partial<Record<LanguageCode, string>>>();
  for (const row of audioRows) {
    const existing = audioByCardId.get(row.card_id) ?? {};
    existing[row.language] = row.audio_url;
    audioByCardId.set(row.card_id, existing);
  }

  return cardRows.map((row) => ({
    id: row.id,
    themeId: row.theme_id,
    translations: {
      en: row.en,
      hi: row.hi,
      zh: row.zh,
      ar: row.ar,
    },
    imageUrl: row.image_url,
    audioUrls: audioByCardId.get(row.id),
  }));
}

export function hasThemeCatalog(themeId: string, minCardCount = 9): boolean {
  const db = getDb();
  const result = db
    .prepare("SELECT COUNT(*) as count FROM cards WHERE theme_id = ?")
    .get(themeId) as { count: number };
  return result.count >= minCardCount;
}
