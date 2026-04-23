import assert from "node:assert/strict";

import type { DilemmaWorld } from "../interpret-dilemma.ts";
import type { JourneySession } from "../journey-session.ts";
import {
  __resetWayHistoryForTests,
  clearWayHistory,
  getWayHistoryEntry,
  getWayHistorySnapshot,
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
      quarto: { descricao: "Manha pesada", elementos: ["cama desfeita"], cor: "#8a96a3", humor: "inercia" },
      sala: { descricao: "TV ligada", elementos: ["sofa amassado"], cor: "#7a8693", humor: "arrependimento" },
      trabalho: { descricao: "Mesmo lugar", elementos: ["mesa desordenada"], cor: "#6b7a8d", humor: "estagnacao" },
      familia: { descricao: "Jantar em silencio", elementos: ["prato pela metade"], cor: "#7d8a9a", humor: "distancia" },
    },
  },
  caminhoMudanca: {
    nome: "Seguiu em frente",
    titulo: "Primeiro dia",
    tom: "transformacao",
    corDominante: "#4a7fa5",
    gradiente: ["#a8d4ef", "#5b9ec9"],
    ambientes: {
      quarto: { descricao: "Alarme as 6h", elementos: ["mochila pronta"], cor: "#7ab8d4", humor: "antecipacao" },
      sala: { descricao: "Planner na mesa", elementos: ["post-its"], cor: "#5a9ab5", humor: "foco" },
      trabalho: { descricao: "Novo espaco", elementos: ["mesa arrumada"], cor: "#4a7fa5", humor: "proposito" },
      familia: { descricao: "Jantar com historia", elementos: ["mesa cheia"], cor: "#5a8fba", humor: "conexao" },
    },
  },
};

function installBrowserStorage(storage: Storage) {
  const target = globalThis as typeof globalThis & {
    localStorage?: Storage;
    window?: { localStorage: Storage };
  };

  target.localStorage = storage;
  target.window = { localStorage: storage };
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
  assert.deepEqual(getWayHistoryEntry("session-abc"), entry);
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
