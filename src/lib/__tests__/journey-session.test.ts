import assert from "node:assert/strict";

import {
  buildUnitySessionUrl,
  issueJourneySession,
  parseUnitySessionUrl,
  verifyJourneySessionToken,
} from "../journey-session.ts";

const secret = "tranquiliways-test-secret";

async function run(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await run("issueJourneySession creates a ready session with a launch token", async () => {
  const session = await issueJourneySession(
    {
      rawInput: "Quero voltar a sentir coragem para viver minha vida.",
      inputMode: "text",
    },
    {
      secret,
      id: "session-123",
      now: "2026-04-17T20:00:00.000Z",
    },
  );

  assert.equal(session.id, "session-123");
  assert.equal(session.createdAt, "2026-04-17T20:00:00.000Z");
  assert.equal(session.rawInput, "Quero voltar a sentir coragem para viver minha vida.");
  assert.equal(session.inputMode, "text");
  assert.equal(session.status, "ready");
  assert.ok(session.launchToken.length > 32);
});

await run("issueJourneySession seals the raw input instead of exposing it in plain text", async () => {
  const session = await issueJourneySession(
    {
      rawInput: "Quero abrir espaco para uma nova fase.",
      inputMode: "voice",
    },
    {
      secret,
      id: "session-sealed",
      now: "2026-04-17T20:10:00.000Z",
    },
  );

  assert.equal(session.launchToken.includes("Quero abrir espaco"), false);
  assert.equal(session.launchToken.includes("session-sealed"), false);
});

await run("verifyJourneySessionToken returns the original session for a valid token", async () => {
  const session = await issueJourneySession(
    {
      rawInput: "Quero abrir espaco para uma nova fase.",
      inputMode: "voice",
    },
    {
      secret,
      id: "session-voice",
      now: "2026-04-17T20:10:00.000Z",
    },
  );

  const verified = await verifyJourneySessionToken({
    id: session.id,
    token: session.launchToken,
    secret,
  });

  assert.deepEqual(verified, session);
});

await run("verifyJourneySessionToken rejects a token for the wrong session id", async () => {
  const session = await issueJourneySession(
    {
      rawInput: "Quero aprender a confiar mais em mim.",
      inputMode: "text",
    },
    {
      secret,
      id: "session-right",
      now: "2026-04-17T20:20:00.000Z",
    },
  );

  const verified = await verifyJourneySessionToken({
    id: "session-wrong",
    token: session.launchToken,
    secret,
  });

  assert.equal(verified, null);
});

await run("buildUnitySessionUrl and parseUnitySessionUrl round-trip the session launch payload", () => {
  const url = buildUnitySessionUrl({
    id: "session-abc",
    launchToken: "token-xyz",
  });

  assert.equal(url, "tranquiliways://session/session-abc?token=token-xyz");

  const parsed = parseUnitySessionUrl(url);

  assert.deepEqual(parsed, {
    id: "session-abc",
    launchToken: "token-xyz",
  });
});

await run("parseUnitySessionUrl returns null for unrelated URLs", () => {
  assert.equal(parseUnitySessionUrl("https://tranquiliways.app/session/123"), null);
  assert.equal(parseUnitySessionUrl("tranquiliways://other/123"), null);
});
