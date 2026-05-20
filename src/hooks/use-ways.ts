import { useCallback, useSyncExternalStore } from "react";

import {
  clearWayHistory,
  getWayHistorySnapshot,
  removeWayHistoryEntry,
  saveJourneySessionHistory,
  subscribeWayHistory,
  type WayHistoryEntry,
} from "@/lib/way-history";
import type { JourneySession } from "@/lib/journey-session";

export type SavedWay = WayHistoryEntry;

// Stable empty snapshot for SSR — must be a single reference, otherwise
// React detects "the store keeps changing" and triggers an infinite re-render
// loop (the `getServerSnapshot should be cached` warning).
const EMPTY_SERVER_SNAPSHOT: WayHistoryEntry[] = [];

export function useWays() {
  const ways = useSyncExternalStore(
    subscribeWayHistory,
    getWayHistorySnapshot,
    () => EMPTY_SERVER_SNAPSHOT,
  );

  const saveWaySession = useCallback((session: JourneySession) => {
    return saveJourneySessionHistory(session);
  }, []);

  const removeWay = useCallback((id: string) => {
    return removeWayHistoryEntry(id);
  }, []);

  const clearWays = useCallback(() => {
    clearWayHistory();
  }, []);

  return { ways, saveWaySession, removeWay, clearWays };
}
