"use client";

import { DBSchema, openDB } from "idb";
import { FlashcardDeck } from "@/types/flashcard";

interface FlashcardsDb extends DBSchema {
  images: {
    key: string;
    value: {
      key: string;
      imageUrl: string;
      createdAt: string;
    };
  };
  audio: {
    key: string;
    value: {
      key: string;
      audioDataUrl: string;
      createdAt: string;
    };
  };
  decks: {
    key: string;
    value: {
      key: string;
      deck: FlashcardDeck;
      createdAt: string;
    };
  };
}

const DB_NAME = "toddler-flashcards-db-v3";
const DB_VERSION = 1;

async function getDb() {
  return openDB<FlashcardsDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("decks")) {
        db.createObjectStore("decks", { keyPath: "key" });
      }
    },
  });
}

export async function getCachedImage(key: string): Promise<string | undefined> {
  const db = await getDb();
  const item = await db.get("images", key);
  return item?.imageUrl;
}

export async function setCachedImage(key: string, imageUrl: string): Promise<void> {
  const db = await getDb();
  await db.put("images", { key, imageUrl, createdAt: new Date().toISOString() });
}

export async function getCachedAudio(
  key: string,
): Promise<string | undefined> {
  const db = await getDb();
  const item = await db.get("audio", key);
  return item?.audioDataUrl;
}

export async function setCachedAudio(
  key: string,
  audioDataUrl: string,
): Promise<void> {
  const db = await getDb();
  await db.put("audio", {
    key,
    audioDataUrl,
    createdAt: new Date().toISOString(),
  });
}

export async function getCachedDeck(
  key: string,
): Promise<FlashcardDeck | undefined> {
  const db = await getDb();
  const item = await db.get("decks", key);
  return item?.deck;
}

export async function setCachedDeck(
  key: string,
  deck: FlashcardDeck,
): Promise<void> {
  const db = await getDb();
  await db.put("decks", { key, deck, createdAt: new Date().toISOString() });
}
