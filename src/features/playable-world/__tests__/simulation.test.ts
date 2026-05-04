import assert from "node:assert/strict";

import { createPlayableWorldFixture } from "./fixtures.ts";
import {
  completeReflection,
  createPlayableWorldState,
  enterPath,
  focusHotspot,
  getActiveRoom,
  getFocusedHotspot,
  goToNextRoom,
  hasVisitedAllRooms,
  returnToHub,
  updateReflectionNote,
} from "../simulation.ts";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run("playable world simulation supports the contemplative exploration loop", () => {
  const world = createPlayableWorldFixture();
  let state = createPlayableWorldState();

  state = enterPath(world, state, "parado");
  assert.equal(state.phase, "path");
  assert.equal(getActiveRoom(world, state)?.id, "quarto");

  const hotspotId = getActiveRoom(world, state)?.hotspots[0]?.id;
  assert.ok(hotspotId);
  state = focusHotspot(world, state, hotspotId!);
  assert.equal(getFocusedHotspot(world, state)?.id, hotspotId);

  state = goToNextRoom(world, state);
  state = goToNextRoom(world, state);
  state = goToNextRoom(world, state);
  assert.equal(getActiveRoom(world, state)?.id, "familia");

  state = goToNextRoom(world, state);
  assert.equal(state.phase, "hub");

  state = enterPath(world, state, "mudanca");
  state = goToNextRoom(world, state);
  state = goToNextRoom(world, state);
  state = goToNextRoom(world, state);
  state = returnToHub(world, state);

  assert.equal(hasVisitedAllRooms(world, state), true);
  assert.equal(state.phase, "reflection");

  state = updateReflectionNote(state, "Eu quero um caminho que me deixe mais presente.");
  state = completeReflection(state);

  assert.equal(state.phase, "complete");
});
