import assert from "node:assert/strict";

import { compileWorldIntent, deriveWorldSeed } from "../compiler.ts";
import { buildFallbackWorldIntent } from "../fallback.ts";
import { PlayableWorldV1Schema } from "../model.ts";
import { createWorldIntentFixture } from "./fixtures.ts";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run("compileWorldIntent produces a deterministic playable world", () => {
  const intent = createWorldIntentFixture();
  const input = {
    id: "playable-world-test",
    dilema: "Devo continuar na carreira segura ou me mover para algo mais vivo?",
    geradoEm: "2026-05-04T10:00:00.000Z",
    intent,
  };

  const left = compileWorldIntent(input);
  const right = compileWorldIntent(input);

  assert.equal(left.version, "playable-v1");
  assert.equal(left.worldSeed, deriveWorldSeed(input.dilema, intent));
  assert.deepEqual(left, right);
  assert.equal(left.paths[0].rooms[0].hotspots.length >= 2, true);
  assert.equal(left.paths[1].rooms[2].props.length >= 3, true);
});

run("buildFallbackWorldIntent compiles into a valid playable world", () => {
  const intent = buildFallbackWorldIntent(
    "Quero largar meu emprego, mas tenho medo de decepcionar minha familia.",
  );
  const world = compileWorldIntent({
    id: "fallback-playable",
    dilema: "Quero largar meu emprego, mas tenho medo de decepcionar minha familia.",
    geradoEm: "2026-05-04T10:10:00.000Z",
    intent,
  });

  const parsed = PlayableWorldV1Schema.safeParse(world);

  assert.equal(parsed.success, true);
  assert.equal(world.paths[0].rooms[0].id, "quarto");
  assert.equal(world.paths[1].rooms[3].id, "familia");
});
