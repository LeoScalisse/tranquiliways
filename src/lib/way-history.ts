import { isJourneyWorld, type JourneyWorld } from "./journey-world.ts";
import {
  isJourneyGenerationWarning,
  normalizeJourneyGenerationMeta,
  type JourneyGenerationSource,
  type JourneyGenerationWarning,
  type JourneyInputMode,
  type JourneySession,
} from "./journey-session.ts";

export type WayHistoryKind = "session" | "legacy";

export interface WayHistoryEntry {
  id: string;
  kind: WayHistoryKind;
  rawInput: string;
  createdAt: string;
  inputMode?: JourneyInputMode;
  world: JourneyWorld;
  launchToken?: string;
  generationSource?: JourneyGenerationSource;
  generationWarning?: JourneyGenerationWarning;
}

type LegacyWayHistoryEntry = Omit<WayHistoryEntry, "generationSource" | "generationWarning"> & {
  generationSource?: JourneyGenerationSource | "gemini";
  generationWarning?:
    | JourneyGenerationWarning
    | "gemini_quota_exhausted"
    | "gemini_unavailable"
    | "gemini_invalid_response";
};

interface LegacySavedWay {
  id: string;
  dilema: string;
  world: JourneyWorld;
  savedAt: number;
}

export const WAY_HISTORY_STORAGE_KEY = "tranquili.way-history.v1";
export const WAY_HISTORY_LEGACY_STORAGE_KEY = "tranquili.ways.v2";

const listeners = new Set<() => void>();

let cache: WayHistoryEntry[] | null = null;

function isBrowserEnvironment() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeTimestamp(value: string, fallback: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? fallback : new Date(timestamp).toISOString();
}

function toTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isLegacyJourneyGenerationWarning(value: unknown) {
  return (
    isJourneyGenerationWarning(value) ||
    value === "gemini_quota_exhausted" ||
    value === "gemini_unavailable" ||
    value === "gemini_invalid_response"
  );
}

function isWayHistoryEntry(value: unknown): value is WayHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LegacyWayHistoryEntry>;

  return (
    typeof candidate.id === "string" &&
    (candidate.kind === "session" || candidate.kind === "legacy") &&
    typeof candidate.rawInput === "string" &&
    typeof candidate.createdAt === "string" &&
    isJourneyWorld(candidate.world) &&
    (candidate.inputMode === undefined ||
      candidate.inputMode === "text" ||
      candidate.inputMode === "voice") &&
    (candidate.launchToken === undefined || typeof candidate.launchToken === "string") &&
    (candidate.generationSource === undefined ||
      candidate.generationSource === "groq" ||
      candidate.generationSource === "gemini" ||
      candidate.generationSource === "fallback") &&
    (candidate.generationWarning === undefined ||
      isLegacyJourneyGenerationWarning(candidate.generationWarning))
  );
}

function normalizeWayHistoryEntry(entry: WayHistoryEntry): WayHistoryEntry {
  const fallbackCreatedAt = new Date().toISOString();
  const generationMeta =
    entry.kind === "session"
      ? normalizeJourneyGenerationMeta(entry)
      : normalizeLegacyGenerationMeta(entry);

  return {
    id: entry.id,
    kind: entry.kind,
    rawInput: entry.rawInput.trim(),
    createdAt: normalizeTimestamp(entry.createdAt, fallbackCreatedAt),
    inputMode: entry.inputMode,
    world: entry.world,
    launchToken: entry.launchToken || undefined,
    ...generationMeta,
  };
}

function normalizeLegacyGenerationMeta(entry: WayHistoryEntry) {
  const legacyEntry = entry as LegacyWayHistoryEntry;

  if (
    legacyEntry.generationSource !== "fallback" &&
    legacyEntry.generationSource !== "groq" &&
    legacyEntry.generationSource !== "gemini"
  ) {
    return {
      generationSource: undefined,
      generationWarning: undefined,
    };
  }

  if (legacyEntry.generationSource === "groq" || legacyEntry.generationSource === "gemini") {
    return {
      generationSource: "groq" as const,
      generationWarning: undefined,
    };
  }

  const normalizedFallback = normalizeJourneyGenerationMeta({
    generationSource: "fallback",
    generationWarning: legacyEntry.generationWarning,
  });

  return {
    generationSource: normalizedFallback.generationSource,
    generationWarning: normalizedFallback.generationWarning,
  };
}

function sortAndDedupeWayHistory(entries: WayHistoryEntry[]) {
  const sorted = [...entries]
    .map(normalizeWayHistoryEntry)
    .sort((left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt));
  const deduped = new Map<string, WayHistoryEntry>();

  for (const entry of sorted) {
    if (!deduped.has(entry.id)) {
      deduped.set(entry.id, entry);
    }
  }

  return Array.from(deduped.values());
}

function emitWayHistoryChange() {
  listeners.forEach((listener) => {
    listener();
  });
}

function writeWayHistory(entries: WayHistoryEntry[], shouldEmit = true) {
  const next = sortAndDedupeWayHistory(entries);
  cache = next;

  if (isBrowserEnvironment()) {
    try {
      localStorage.setItem(WAY_HISTORY_STORAGE_KEY, JSON.stringify(next));
      localStorage.removeItem(WAY_HISTORY_LEGACY_STORAGE_KEY);
    } catch {
      // Ignore quota/storage errors and keep the in-memory cache updated.
    }
  }

  if (shouldEmit) {
    emitWayHistoryChange();
  }

  return next;
}

function migrateLegacyWays(raw: string | null): WayHistoryEntry[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as LegacySavedWay[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => {
        return (
          item &&
          typeof item.id === "string" &&
          typeof item.dilema === "string" &&
          typeof item.savedAt === "number" &&
          isJourneyWorld(item.world)
        );
      })
      .map((item) => {
        const savedAtDate = new Date(item.savedAt);

        return {
          id: `legacy:${item.id}`,
          kind: "legacy" as const,
          rawInput: item.dilema,
          createdAt: normalizeTimestamp(
            Number.isNaN(savedAtDate.valueOf()) ? "" : savedAtDate.toISOString(),
            new Date().toISOString(),
          ),
          world: item.world,
        };
      });
  } catch {
    return [];
  }
}

function loadWayHistoryFromStorage() {
  if (!isBrowserEnvironment()) {
    return [];
  }

  const storedHistory = localStorage.getItem(WAY_HISTORY_STORAGE_KEY);

  if (storedHistory !== null) {
    try {
      const parsed = JSON.parse(storedHistory) as unknown[];
      const entries = Array.isArray(parsed)
        ? sortAndDedupeWayHistory(parsed.filter(isWayHistoryEntry))
        : [];

      cache = entries;
      return entries;
    } catch {
      // Fall back to legacy migration if the new key is corrupted.
    }
  }

  const migrated = migrateLegacyWays(localStorage.getItem(WAY_HISTORY_LEGACY_STORAGE_KEY));
  return writeWayHistory(migrated, false);
}

function ensureWayHistoryLoaded() {
  if (cache) {
    return cache;
  }

  cache = loadWayHistoryFromStorage();
  return cache;
}

export function createWayHistoryEntryFromSession(session: JourneySession): WayHistoryEntry {
  return normalizeWayHistoryEntry({
    id: session.id,
    kind: "session",
    rawInput: session.rawInput,
    createdAt: session.createdAt,
    inputMode: session.inputMode,
    world: session.world,
    launchToken: session.launchToken,
    generationSource: session.generationSource,
    generationWarning: session.generationWarning,
  });
}

export function getWayHistorySnapshot() {
  return ensureWayHistoryLoaded();
}

export function subscribeWayHistory(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getWayHistoryEntry(id: string) {
  return ensureWayHistoryLoaded().find((entry) => entry.id === id) ?? null;
}

export function upsertWayHistoryEntry(entry: WayHistoryEntry) {
  const nextEntries = [
    normalizeWayHistoryEntry(entry),
    ...ensureWayHistoryLoaded().filter((candidate) => candidate.id !== entry.id),
  ];

  writeWayHistory(nextEntries);
  return getWayHistoryEntry(entry.id);
}

export function saveJourneySessionHistory(session: JourneySession) {
  const entry = createWayHistoryEntryFromSession(session);
  return upsertWayHistoryEntry(entry);
}

export function clearWayHistory() {
  cache = [];

  if (isBrowserEnvironment()) {
    try {
      localStorage.setItem(WAY_HISTORY_STORAGE_KEY, JSON.stringify([]));
      localStorage.removeItem(WAY_HISTORY_LEGACY_STORAGE_KEY);
    } catch {
      // Ignore quota/storage errors and keep the in-memory cache updated.
    }
  }

  emitWayHistoryChange();
}

export function __resetWayHistoryForTests() {
  cache = null;
  listeners.clear();
}
