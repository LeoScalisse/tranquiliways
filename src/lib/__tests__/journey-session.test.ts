import assert from "node:assert/strict";

import {
  issueJourneySession,
  normalizeJourneyGenerationMeta,
  verifyJourneySessionToken,
} from "../journey-session.ts";
import type { DilemmaWorld } from "../interpret-dilemma.ts";

const secret = "tranquiliways-test-secret";

const stubWorld: DilemmaWorld = {
  id: "world-stub",
  dilema: "Devo largar meu emprego seguro?",
  geradoEm: "2026-04-17T20:00:00.000Z",
  caminhoParado: {
    nome: "Ficou parado",
    titulo: "Mesa vazia",
    tom: "arrependimento",
    corDominante: "#6b7a8d",
    gradiente: ["#c9d0d8", "#8a96a3"],
    ambientes: {
      quarto: { descricao: "Manhã pesada", elementos: ["cama desfeita"], cor: "#8a96a3", humor: "inércia" },
      sala: { descricao: "TV ligada", elementos: ["sofá amassado"], cor: "#7a8693", humor: "arrependimento" },
      trabalho: { descricao: "Mesmo lugar", elementos: ["mesa desordenada"], cor: "#6b7a8d", humor: "estagnação" },
      familia: { descricao: "Jantar em silêncio", elementos: ["prato pela metade"], cor: "#7d8a9a", humor: "distância" },
    },
  },
  caminhoMudanca: {
    nome: "Seguiu em frente",
    titulo: "Primeiro dia",
    tom: "transformacao",
    corDominante: "#4a7fa5",
    gradiente: ["#a8d4ef", "#5b9ec9"],
    ambientes: {
      quarto: { descricao: "Alarme às 6h", elementos: ["mochila pronta"], cor: "#7ab8d4", humor: "antecipação" },
      sala: { descricao: "Planner na mesa", elementos: ["post-its"], cor: "#5a9ab5", humor: "foco" },
      trabalho: { descricao: "Novo espaço", elementos: ["mesa arrumada"], cor: "#4a7fa5", humor: "propósito" },
      familia: { descricao: "Jantar com história", elementos: ["mesa cheia"], cor: "#5a8fba", humor: "conexão" },
    },
  },
};

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
      rawInput: "Devo largar meu emprego seguro para seguir minha paixão?",
      inputMode: "text",
      world: stubWorld,
    },
    {
      secret,
      id: "session-123",
      now: "2026-04-17T20:00:00.000Z",
    },
  );

  assert.equal(session.id, "session-123");
  assert.equal(session.createdAt, "2026-04-17T20:00:00.000Z");
  assert.equal(session.rawInput, "Devo largar meu emprego seguro para seguir minha paixão?");
  assert.equal(session.inputMode, "text");
  assert.equal(session.status, "ready");
  assert.equal(session.generationSource, "groq");
  assert.equal(session.generationWarning, undefined);
  assert.ok(session.launchToken.length > 32);
  assert.ok(session.world !== null);
});

await run("issueJourneySession seals o dilema e o mundo em vez de expô-los em texto simples", async () => {
  const session = await issueJourneySession(
    {
      rawInput: "Devo me separar do meu parceiro?",
      inputMode: "voice",
      world: stubWorld,
    },
    {
      secret,
      id: "session-sealed",
      now: "2026-04-17T20:10:00.000Z",
    },
  );

  assert.equal(session.launchToken.includes("Devo me separar"), false);
  assert.equal(session.launchToken.includes("session-sealed"), false);
  assert.equal(session.launchToken.includes("world-stub"), false);
});

await run("issueJourneySession preserva metadata de fallback no token da sessão", async () => {
  const session = await issueJourneySession(
    {
      rawInput: "Estou travado entre seguir como estou e me mover.",
      inputMode: "text",
      world: stubWorld,
      generationSource: "fallback",
      generationWarning: "groq_quota_exhausted",
    },
    {
      secret,
      id: "session-fallback",
      now: "2026-04-17T20:05:00.000Z",
    },
  );

  const verified = await verifyJourneySessionToken({
    id: session.id,
    token: session.launchToken,
    secret,
  });

  assert.equal(session.generationSource, "fallback");
  assert.equal(session.generationWarning, "groq_quota_exhausted");
  assert.deepEqual(verified, session);
});

await run("normalizeJourneyGenerationMeta converte metadata legada da Gemini para Groq", () => {
  const direct = normalizeJourneyGenerationMeta({
    generationSource: "gemini",
  } as never);

  const fallback = normalizeJourneyGenerationMeta({
    generationSource: "fallback",
    generationWarning: "gemini_quota_exhausted",
  } as never);

  assert.deepEqual(direct, {
    generationSource: "groq",
  });
  assert.deepEqual(fallback, {
    generationSource: "fallback",
    generationWarning: "groq_quota_exhausted",
  });
});

await run("verifyJourneySessionToken retorna a sessão original para um token válido", async () => {
  const session = await issueJourneySession(
    {
      rawInput: "Devo investir todas as minhas economias em um negócio?",
      inputMode: "voice",
      world: stubWorld,
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

await run("verifyJourneySessionToken rejeita token para session id errado", async () => {
  const session = await issueJourneySession(
    {
      rawInput: "Devo largar tudo e viajar pelo mundo?",
      inputMode: "text",
      world: stubWorld,
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
