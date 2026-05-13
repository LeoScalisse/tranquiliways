import assert from "node:assert/strict";

import { getJourneySession } from "../journey-api.ts";
import type { JourneySession } from "../journey-session.ts";

const stubSession = {
  id: "session-123",
  launchToken: "token-123",
  createdAt: "2026-05-04T21:00:00.000Z",
  rawInput: "Devo mudar de cidade?",
  inputMode: "text",
  status: "ready",
  generationSource: "gemini",
  world: {
    version: "playable-v1",
    id: "world-123",
    dilema: "Devo mudar de cidade?",
    card: {
      badge: "Tradeoff",
      title: "Cidade nova",
      subtitle: "Uma mudanca com custo real",
    },
    paths: [],
  },
} as unknown as JourneySession;

async function run(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await run("getJourneySession envia o launch token no corpo da requisicao", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl: string | undefined;
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(JSON.stringify(stubSession), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const result = await getJourneySession({
      id: "session-123",
      launchToken: "token-123",
    });

    assert.equal(capturedUrl, "/api/sessions/session-123");
    assert.equal(capturedInit?.method, "POST");
    assert.deepEqual(capturedInit?.headers, { "Content-Type": "application/json" });
    assert.equal(capturedInit?.body, JSON.stringify({ launchToken: "token-123" }));
    assert.deepEqual(result, stubSession);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
