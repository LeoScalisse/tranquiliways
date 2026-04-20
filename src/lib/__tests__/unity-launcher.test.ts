import assert from "node:assert/strict";

import { resolveUnityLauncherState } from "../unity-launcher.ts";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run("resolveUnityLauncherState enables launch on native Android", () => {
  const state = resolveUnityLauncherState({
    isNativePlatform: true,
    platform: "android",
  });

  assert.deepEqual(state, {
    canLaunch: true,
    reason: null,
  });
});

run("resolveUnityLauncherState blocks launch outside native Android", () => {
  const state = resolveUnityLauncherState({
    isNativePlatform: false,
    platform: "web",
  });

  assert.deepEqual(state, {
    canLaunch: false,
    reason: "Disponivel apenas no Android nesta fase da Primeira Chama.",
  });
});
