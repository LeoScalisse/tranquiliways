import assert from "node:assert/strict";
import { WorldIntentSchema } from "../model.ts";

// Minimal valid WorldIntent with hubDescription on both paths
const intentWithHub = {
  version: "world-intent-v1",
  theme: "career",
  dilemmaType: "tradeoff",
  cameraPreset: "isometric-calm",
  card: { badge: "T", title: "T", subtitle: "S" },
  hub: { title: "H", subtitle: "S" },
  reflectionPrompt: "O que ficou vivo em você?",
  paths: [
    {
      id: "parado",
      label: "Ficar",
      title: "Mesa vazia",
      summary: "A rotina sem mudança.",
      colorHint: "mist",
      closureLine: "Seguro, mas vazio.",
      hubDescription: "Escritório familiar com luz amarelada e papéis empilhados — o peso da rotina.",
      rooms: [
        {
          id: "quarto",
          title: "Quarto",
          summary: "Manhã pesada.",
          mood: "inércia",
          layout: "sanctuary",
          climate: "dawn",
          propStory: ["bed", "lamp", "plant"],
          hotspots: [
            { kind: "memory", label: "Alarme", prompt: "O que você adia?", insight: "O adiamento tem custo." },
            { kind: "choice", label: "Escolha", prompt: "E se fosse diferente?", insight: "Cada manhã é uma decisão." },
          ],
        },
        {
          id: "sala",
          title: "Sala",
          summary: "TV ligada.",
          mood: "anestesia",
          layout: "corridor",
          climate: "overcast",
          propStory: ["sofa", "lamp", "mug"],
          hotspots: [
            { kind: "body", label: "Corpo", prompt: "Como está seu corpo?", insight: "O corpo guarda o que a mente nega." },
            { kind: "relationship", label: "Distância", prompt: "Quem você evita?", insight: "Isolamento protege e aprisiona." },
          ],
        },
      ],
    },
    {
      id: "mudanca",
      label: "Mudar",
      title: "Primeiro dia",
      summary: "O novo e o incerto.",
      colorHint: "ember",
      closureLine: "Assustador e vivo.",
      hubDescription: "Novo espaço desconhecido com luz diferente — a antessala do possível.",
      rooms: [
        {
          id: "trabalho",
          title: "Trabalho",
          summary: "Novo cargo, novo risco.",
          mood: "antecipação",
          layout: "crossroads",
          climate: "golden",
          propStory: ["desk", "notebook", "plant"],
          hotspots: [
            { kind: "work", label: "Competência", prompt: "O que você sabe fazer?", insight: "Competência constrói confiança." },
            { kind: "future", label: "Futuro", prompt: "Onde você quer estar?", insight: "Clareza de destino guia o caminho." },
          ],
        },
        {
          id: "familia",
          title: "Família",
          summary: "Orgulho partilhado.",
          mood: "conexão",
          layout: "sanctuary",
          climate: "golden",
          propStory: ["table", "chair", "lamp"],
          hotspots: [
            { kind: "relationship", label: "Apoio", prompt: "Quem te apoia?", insight: "Apoio real muda o que é possível." },
            { kind: "support", label: "Vulnerabilidade", prompt: "O que você ainda não disse?", insight: "Honestidade cria conexão." },
          ],
        },
      ],
    },
  ],
};

const result = WorldIntentSchema.safeParse(intentWithHub);
assert.ok(result.success, `WorldIntentSchema should accept hubDescription: ${JSON.stringify(result.error?.issues)}`);
assert.equal(result.data?.paths[0].hubDescription, "Escritório familiar com luz amarelada e papéis empilhados — o peso da rotina.");
assert.equal(result.data?.paths[1].hubDescription, "Novo espaço desconhecido com luz diferente — a antessala do possível.");
console.log("✓ WorldIntentSchema accepts hubDescription on paths");

// Verify hubDescription is truly optional
const minimalPath = (id: "parado" | "mudanca", colorHint: string, closureLine: string) => ({
  id,
  label: "L",
  title: "T",
  summary: "S",
  colorHint,
  closureLine,
  // no hubDescription
  rooms: [
    {
      id: "quarto",
      title: "Q",
      summary: "S",
      mood: "m",
      layout: "sanctuary",
      climate: "dawn",
      propStory: ["bed", "lamp", "plant"],
      hotspots: [
        { kind: "memory", label: "A", prompt: "P", insight: "I" },
        { kind: "choice", label: "B", prompt: "Q", insight: "J" },
      ],
    },
    {
      id: "sala",
      title: "Sa",
      summary: "Ss",
      mood: "mm",
      layout: "corridor",
      climate: "overcast",
      propStory: ["sofa", "lamp", "mug"],
      hotspots: [
        { kind: "body", label: "C", prompt: "R", insight: "K" },
        { kind: "relationship", label: "D", prompt: "T2", insight: "L" },
      ],
    },
  ],
});

const intentWithoutHub = {
  version: "world-intent-v1",
  theme: "career",
  dilemmaType: "tradeoff",
  cameraPreset: "isometric-calm",
  card: { badge: "X", title: "X", subtitle: "X" },
  hub: { title: "X", subtitle: "X" },
  reflectionPrompt: "O que ficou vivo em você?",
  paths: [minimalPath("parado", "mist", "ok"), minimalPath("mudanca", "ember", "ok")],
};

const resultNoHub = WorldIntentSchema.safeParse(intentWithoutHub);
assert.ok(resultNoHub.success, `WorldIntentSchema should accept paths without hubDescription: ${JSON.stringify(resultNoHub.error?.issues)}`);
assert.equal(resultNoHub.data?.paths[0].hubDescription, undefined);
assert.equal(resultNoHub.data?.paths[1].hubDescription, undefined);
console.log("✓ WorldIntentSchema accepts paths without hubDescription (optional confirmed)");
