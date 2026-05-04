import type {
  HotspotBlueprint,
  PathBlueprint,
  PathId,
  PlayableWorldV1,
  RoomBlueprint,
  RoomId,
} from "./model.ts";

export interface PlayableWorldState {
  phase: "hub" | "path" | "reflection" | "complete";
  activePathId: PathId | null;
  activeRoomIndex: number;
  focusedHotspotId: string | null;
  visitedRooms: string[];
  discoveredHotspots: string[];
  reflectionNote: string;
}

function roomVisitKey(pathId: PathId, roomId: RoomId) {
  return `${pathId}:${roomId}`;
}

function markVisited(list: string[], value: string) {
  return list.includes(value) ? list : [...list, value];
}

export function createPlayableWorldState(): PlayableWorldState {
  return {
    phase: "hub",
    activePathId: null,
    activeRoomIndex: 0,
    focusedHotspotId: null,
    visitedRooms: [],
    discoveredHotspots: [],
    reflectionNote: "",
  };
}

export function getPath(world: PlayableWorldV1, pathId: PathId | null): PathBlueprint | null {
  if (!pathId) return null;
  return world.paths.find((path) => path.id === pathId) ?? null;
}

export function getActiveRoom(
  world: PlayableWorldV1,
  state: PlayableWorldState,
): RoomBlueprint | null {
  const path = getPath(world, state.activePathId);
  if (!path) return null;
  return path.rooms[state.activeRoomIndex] ?? null;
}

export function getFocusedHotspot(
  world: PlayableWorldV1,
  state: PlayableWorldState,
): HotspotBlueprint | null {
  const room = getActiveRoom(world, state);
  if (!room || !state.focusedHotspotId) return null;
  return room.hotspots.find((hotspot) => hotspot.id === state.focusedHotspotId) ?? null;
}

export function enterPath(
  world: PlayableWorldV1,
  state: PlayableWorldState,
  pathId: PathId,
): PlayableWorldState {
  const path = getPath(world, pathId);
  if (!path) return state;
  const firstRoom = path.rooms[0];

  return {
    ...state,
    phase: "path",
    activePathId: pathId,
    activeRoomIndex: 0,
    focusedHotspotId: null,
    visitedRooms: markVisited(state.visitedRooms, roomVisitKey(pathId, firstRoom.id)),
  };
}

export function focusHotspot(
  world: PlayableWorldV1,
  state: PlayableWorldState,
  hotspotId: string,
): PlayableWorldState {
  const room = getActiveRoom(world, state);
  if (!room) return state;
  const exists = room.hotspots.some((hotspot) => hotspot.id === hotspotId);
  if (!exists) return state;

  return {
    ...state,
    focusedHotspotId: hotspotId,
    discoveredHotspots: markVisited(state.discoveredHotspots, hotspotId),
  };
}

export function closeHotspot(state: PlayableWorldState): PlayableWorldState {
  return {
    ...state,
    focusedHotspotId: null,
  };
}

export function goToPreviousRoom(
  world: PlayableWorldV1,
  state: PlayableWorldState,
): PlayableWorldState {
  if (!state.activePathId) return state;
  if (state.activeRoomIndex === 0) {
    return returnToHub(world, state);
  }

  const nextRoomIndex = state.activeRoomIndex - 1;
  const path = getPath(world, state.activePathId);
  const room = path?.rooms[nextRoomIndex];
  if (!room) return state;

  return {
    ...state,
    activeRoomIndex: nextRoomIndex,
    focusedHotspotId: null,
    visitedRooms: markVisited(state.visitedRooms, roomVisitKey(state.activePathId, room.id)),
  };
}

export function goToNextRoom(
  world: PlayableWorldV1,
  state: PlayableWorldState,
): PlayableWorldState {
  if (!state.activePathId) return state;
  const path = getPath(world, state.activePathId);
  if (!path) return state;

  if (state.activeRoomIndex >= path.rooms.length - 1) {
    return returnToHub(world, state);
  }

  const nextRoomIndex = state.activeRoomIndex + 1;
  const room = path.rooms[nextRoomIndex];

  return {
    ...state,
    activeRoomIndex: nextRoomIndex,
    focusedHotspotId: null,
    visitedRooms: markVisited(state.visitedRooms, roomVisitKey(state.activePathId, room.id)),
  };
}

export function returnToHub(world: PlayableWorldV1, state: PlayableWorldState): PlayableWorldState {
  const canReflect = hasVisitedAllRooms(world, state);

  return {
    ...state,
    phase: canReflect ? "reflection" : "hub",
    activePathId: null,
    activeRoomIndex: 0,
    focusedHotspotId: null,
  };
}

export function openReflection(
  world: PlayableWorldV1,
  state: PlayableWorldState,
): PlayableWorldState {
  if (!hasVisitedAllRooms(world, state)) return state;

  return {
    ...state,
    phase: "reflection",
    activePathId: null,
    activeRoomIndex: 0,
    focusedHotspotId: null,
  };
}

export function updateReflectionNote(state: PlayableWorldState, note: string): PlayableWorldState {
  return {
    ...state,
    reflectionNote: note,
  };
}

export function completeReflection(state: PlayableWorldState): PlayableWorldState {
  if (state.reflectionNote.trim().length === 0) return state;

  return {
    ...state,
    phase: "complete",
    focusedHotspotId: null,
  };
}

export function hasVisitedAllRooms(world: PlayableWorldV1, state: PlayableWorldState) {
  return world.paths.every((path) =>
    path.rooms.every((room) => state.visitedRooms.includes(roomVisitKey(path.id, room.id))),
  );
}

export function getExplorationProgress(world: PlayableWorldV1, state: PlayableWorldState) {
  const totalRooms = world.paths.reduce((sum, path) => sum + path.rooms.length, 0);
  const visitedRoomCount = state.visitedRooms.length;

  return {
    totalRooms,
    visitedRoomCount,
    ratio: totalRooms === 0 ? 0 : visitedRoomCount / totalRooms,
  };
}
