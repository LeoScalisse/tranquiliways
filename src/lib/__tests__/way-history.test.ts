import assert from "node:assert/strict";

import { createPlayableWorldFixture } from "../../features/playable-world/__tests__/fixtures.ts";
import type { DilemmaWorld } from "../interpret-dilemma.ts";
import type { JourneySession } from "../journey-session.ts";
import { isPlayableWorld } from "../journey-world.ts";
import {
  __resetWayHistoryForTests,
  clearWayHistory,
  getWayHistoryEntry,
  getWayHistorySnapshot,
  removeWayHistoryEntry,
  saveJourneySessionHistory,
  WAY_HISTORY_LEGACY_STORAGE_KEY,
  WAY_HISTORY_STORAGE_KEY,
} from "../way-history.ts";

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

const stubWorld: DilemmaWorld = {
  id: "world-stub",
  dilema: "Devo mudar de carreira?",
  geradoEm: "2026-04-17T20:00:00.000Z",
  caminhoParado: {
    nome: "Ficou parado",
    titulo: "Mesa vazia",
    tom: "arrependimento",
    corDominante: "#6b7a8d",
    gradiente: ["#c9d0d8", "#8a96a3"],
    ambientes: {
      quarto: {
        descricao: "Manha pesada",
        elementos: ["cama desfeita"],
        cor: "#8a96a3",
        humor: "inercia",
      },
      sala: {
        descricao: "TV ligada",
        elementos: ["sofa amassado"],
        cor: "#7a8693",
        humor: "arrependimento",
      },
      trabalho: {
        descricao: "Mesmo lugar",
        elementos: ["mesa desordenada"],
        cor: "#6b7a8d",
        humor: "estagnacao",
      },
      familia: {
        descricao: "Jantar em silencio",
        elementos: ["prato pela metade"],
        cor: "#7d8a9a",
        humor: "distancia",
      },
    },
  },
  caminhoMudanca: {
    nome: "Seguiu em frente",
    titulo: "Primeiro dia",
    tom: "transformacao",
    corDominante: "#4a7fa5",
    gradiente: ["#a8d4ef", "#5b9ec9"],
    ambientes: {
      quarto: {
        descricao: "Alarme as 6h",
        elementos: ["mochila pronta"],
        cor: "#7ab8d4",
        humor: "antecipacao",
      },
      sala: {
        descricao: "Planner na mesa",
        elementos: ["post-its"],
        cor: "#5a9ab5",
        humor: "foco",
      },
      trabalho: {
        descricao: "Novo espaco",
        elementos: ["mesa arrumada"],
        cor: "#4a7fa5",
        humor: "proposito",
      },
      familia: {
        descricao: "Jantar com historia",
        elementos: ["mesa cheia"],
        cor: "#5a8fba",
        humor: "conexao",
      },
    },
  },
};

function installBrowserStorage(storage: Storage) {
  const target = globalThis as typeof globalThis & {
    localStorage?: Storage;
    window?: Window & typeof globalThis;
  };

  target.localStorage = storage;
  target.window = { localStorage: storage } as Window & typeof globalThis;
}

function createSession(overrides: Partial<JourneySession> = {}): JourneySession {
  return {
    id: overrides.id ?? "session-123",
    launchToken: overrides.launchToken ?? "token-123",
    createdAt: overrides.createdAt ?? "2026-04-17T20:00:00.000Z",
    rawInput: overrides.rawInput ?? "Devo mudar de carreira?",
    inputMode: overrides.inputMode ?? "text",
    status: overrides.status ?? "ready",
    world: overrides.world ?? stubWorld,
    generationSource: overrides.generationSource ?? "gemini",
    generationWarning: overrides.generationWarning,
  };
}

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

run("getWayHistorySnapshot migra o storage legado para o formato baseado em sessao", () => {
  const storage = new MemoryStorage();
  installBrowserStorage(storage);
  __resetWayHistoryForTests();

  storage.setItem(
    WAY_HISTORY_LEGACY_STORAGE_KEY,
    JSON.stringify([
      {
        id: "world-1",
        dilema: "Continuo no emprego atual?",
        world: stubWorld,
        savedAt: Date.parse("2026-04-17T19:00:00.000Z"),
      },
    ]),
  );

  const snapshot = getWayHistorySnapshot();

  assert.equal(snapshot.length, 1);
  assert.equal(snapshot[0]?.id, "legacy:world-1");
  assert.equal(snapshot[0]?.kind, "legacy");
  assert.equal(snapshot[0]?.rawInput, "Continuo no emprego atual?");
  assert.equal(snapshot[0]?.launchToken, undefined);
  assert.equal(storage.getItem(WAY_HISTORY_LEGACY_STORAGE_KEY), null);
  assert.ok(storage.getItem(WAY_HISTORY_STORAGE_KEY));
});

run("saveJourneySessionHistory persiste sessoes novas com token e input mode", () => {
  const storage = new MemoryStorage();
  installBrowserStorage(storage);
  __resetWayHistoryForTests();

  const session = createSession({
    id: "session-abc",
    launchToken: "launch-token-abc",
    inputMode: "voice",
  });

  const entry = saveJourneySessionHistory(session);

  assert.equal(entry?.id, "session-abc");
  assert.equal(entry?.kind, "session");
  assert.equal(entry?.launchToken, "launch-token-abc");
  assert.equal(entry?.inputMode, "voice");
  assert.equal(entry?.generationSource, "gemini");
  assert.equal(entry?.generationWarning, undefined);
  assert.deepEqual(getWayHistoryEntry("session-abc"), entry);
});

run("saveJourneySessionHistory persiste aviso de fallback para reabertura", () => {
  const storage = new MemoryStorage();
  installBrowserStorage(storage);
  __resetWayHistoryForTests();

  saveJourneySessionHistory(
    createSession({
      id: "session-fallback",
      generationSource: "fallback",
      generationWarning: "gemini_quota_exhausted",
    }),
  );

  const restored = getWayHistoryEntry("session-fallback");

  assert.equal(restored?.generationSource, "fallback");
  assert.equal(restored?.generationWarning, "gemini_quota_exhausted");
});

run("getWayHistorySnapshot normaliza metadata legada da Groq ao carregar storage novo", () => {
  const storage = new MemoryStorage();
  installBrowserStorage(storage);
  __resetWayHistoryForTests();

  storage.setItem(
    WAY_HISTORY_STORAGE_KEY,
    JSON.stringify([
      {
        kind: "session",
        ...createSession({
          id: "session-legacy-provider",
        }),
        generationSource: "groq",
      },
      {
        kind: "session",
        ...createSession({
          id: "session-legacy-fallback",
          generationSource: "fallback",
        }),
        generationWarning: "groq_unavailable",
      },
    ]),
  );

  const snapshot = getWayHistorySnapshot();
  const providerEntry = snapshot.find((entry) => entry.id === "session-legacy-provider");
  const fallbackEntry = snapshot.find((entry) => entry.id === "session-legacy-fallback");

  assert.equal(providerEntry?.generationSource, "gemini");
  assert.equal(providerEntry?.generationWarning, undefined);
  assert.equal(fallbackEntry?.generationSource, "fallback");
  assert.equal(fallbackEntry?.generationWarning, "gemini_unavailable");
});

run("saveJourneySessionHistory mantem o historico ordenado do mais novo para o mais antigo", () => {
  const storage = new MemoryStorage();
  installBrowserStorage(storage);
  __resetWayHistoryForTests();
  clearWayHistory();

  saveJourneySessionHistory(
    createSession({
      id: "session-old",
      createdAt: "2026-04-17T18:00:00.000Z",
      launchToken: "token-old",
    }),
  );
  saveJourneySessionHistory(
    createSession({
      id: "session-new",
      createdAt: "2026-04-17T21:00:00.000Z",
      launchToken: "token-new",
    }),
  );

  const snapshot = getWayHistorySnapshot();

  assert.deepEqual(
    snapshot.map((entry) => entry.id),
    ["session-new", "session-old"],
  );
});

run("removeWayHistoryEntry exclui apenas a way pedida e preserva as demais", () => {
  const storage = new MemoryStorage();
  installBrowserStorage(storage);
  __resetWayHistoryForTests();
  clearWayHistory();

  saveJourneySessionHistory(
    createSession({
      id: "session-old",
      createdAt: "2026-04-17T18:00:00.000Z",
      launchToken: "token-old",
    }),
  );
  saveJourneySessionHistory(
    createSession({
      id: "session-new",
      createdAt: "2026-04-17T21:00:00.000Z",
      launchToken: "token-new",
    }),
  );

  const removed = removeWayHistoryEntry("session-old");
  const snapshot = getWayHistorySnapshot();
  const persisted = storage.getItem(WAY_HISTORY_STORAGE_KEY) ?? "";

  assert.equal(removed?.id, "session-old");
  assert.equal(getWayHistoryEntry("session-old"), null);
  assert.deepEqual(
    snapshot.map((entry) => entry.id),
    ["session-new"],
  );
  assert.equal(persisted.includes("session-old"), false);
  assert.equal(persisted.includes("session-new"), true);
});

run("saveJourneySessionHistory reabre sessoes jogaveis sem quebrar o historico", () => {
  const storage = new MemoryStorage();
  installBrowserStorage(storage);
  __resetWayHistoryForTests();

  const playableSession = createSession({
    id: "session-playable",
    world: createPlayableWorldFixture(),
  });

  saveJourneySessionHistory(playableSession);
  const restored = getWayHistoryEntry("session-playable");
  const playableWorld = restored?.world as { version?: string; paths?: unknown[] } | undefined;

  assert.equal(restored?.id, "session-playable");
  assert.equal(playableWorld?.version, "playable-v1");
  assert.equal(Array.isArray(playableWorld?.paths), true);
});

run("saveJourneySessionHistory reconhece mundo jogavel mesmo com dilema longo", () => {
  const storage = new MemoryStorage();
  installBrowserStorage(storage);
  __resetWayHistoryForTests();

  const longDilemma =
    "Estou entre continuar na carreira segura que me protege hoje e me mover para um trabalho " +
    "mais alinhado com o que eu quero construir, mas isso mexe com medo, familia, dinheiro e " +
    "com a sensacao de que posso me arrepender se eu errar o tempo desse movimento.";

  const playableWorld = {
    ...createPlayableWorldFixture(),
    dilema: longDilemma,
  };

  saveJourneySessionHistory(
    createSession({
      id: "session-playable-long",
      rawInput: longDilemma,
      world: playableWorld,
    }),
  );

  const restored = getWayHistoryEntry("session-playable-long");

  assert.equal(restored?.rawInput, longDilemma);
  assert.equal(isPlayableWorld(restored?.world), true);
});
