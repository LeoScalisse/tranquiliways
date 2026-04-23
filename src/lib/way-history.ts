import type { DilemmaWorld } from "./interpret-dilemma";
import type { JourneyInputMode, JourneySession } from "./journey-session";

export type WayHistoryKind = "session" | "legacy";

export interface WayHistoryEntry {
  id: string;
  kind: WayHistoryKind;
  rawInput: string;
  createdAt: string;
  inputMode?: JourneyInputMode;
  world: DilemmaWorld;
  launchToken?: string;
}

interface LegacySavedWay {
  id: string;
  dilema: string;
  world: DilemmaWorld;
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

function isDilemmaWorld(value: unknown): value is DilemmaWorld {
  return value !== null && typeof value === "object";
}

function isWayHistoryEntry(value: unknown): value is WayHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WayHistoryEntry>;

  return (
    typeof candidate.id === "string" &&
    (candidate.kind === "session" || candidate.kind === "legacy") &&
    typeof candidate.rawInput === "string" &&
    typeof candidate.createdAt === "string" &&
    isDilemmaWorld(candidate.world) &&
    (candidate.inputMode === undefined ||
      candidate.inputMode === "text" ||
      candidate.inputMode === "voice") &&
    (candidate.launchToken === undefined || typeof candidate.launchToken === "string")
  );
}

function normalizeWayHistoryEntry(entry: WayHistoryEntry): WayHistoryEntry {
  const fallbackCreatedAt = new Date().toISOString();

  return {
    id: entry.id,
    kind: entry.kind,
    rawInput: entry.rawInput.trim(),
    createdAt: normalizeTimestamp(entry.createdAt, fallbackCreatedAt),
    inputMode: entry.inputMode,
    world: entry.world,
    launchToken: entry.launchToken || undefined,
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
          isDilemmaWorld(item.world)
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
