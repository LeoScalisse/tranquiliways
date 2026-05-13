import assert from "node:assert/strict";

import {
  WORLD_CREATION_STAGES,
  getWorldCreationStageIndex,
  type WorldCreationStageId,
} from "../world-creation-loader.tsx";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run("WorldCreationLoader usa a fase recebida em vez de um timer autonomo", () => {
  const stageIds = WORLD_CREATION_STAGES.map((stage) => stage.id);
  const expected: WorldCreationStageId[] = [
    "preparing",
    "generating",
    "receiving",
    "saving",
    "opening",
  ];

  assert.deepEqual(stageIds, expected);
  assert.equal(getWorldCreationStageIndex("preparing"), 0);
  assert.equal(getWorldCreationStageIndex("generating"), 1);
  assert.equal(getWorldCreationStageIndex("opening"), 4);
});
