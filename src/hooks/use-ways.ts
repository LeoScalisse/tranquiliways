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

export function useWays() {
  const ways = useSyncExternalStore(subscribeWayHistory, getWayHistorySnapshot, () => []);

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
