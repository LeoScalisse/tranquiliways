import { z } from "zod";

import {
  CAMERA_PRESETS,
  CLIMATE_PRESETS,
  COLOR_HINTS,
  DILEMMA_THEMES,
  DILEMMA_TYPES,
  HOTSPOT_KINDS,
  PATH_IDS,
  PROP_KINDS,
  ROOM_IDS,
  ROOM_LAYOUTS,
  WorldIntentSchema,
  type WorldIntent,
} from "./model.ts";

export const GeminiPlayableGuardrailSchema = z.object({
  guardrail: z.literal(true),
});

function list(values: readonly string[]) {
  return values.map((value) => `"${value}"`).join(", ");
}

export function buildPlayableWorldPrompt(
  dilema: string,
  answers: { question: string; answer: string }[],
): string {
  const answersText =
    answers.length > 0
      ? `\nCONTEXTO ADICIONAL:\n${answers.map((item) => `- ${item.question}\n  ${item.answer}`).join("\n")}`
      : "";

  return `Voce e o motor semantico do TranquiliWays. Sua funcao e devolver um blueprint JSON valido \
para um mundo 2.5D contemplativo, touch-first e emocionalmente seguro.${answersText}

DILEMA: "${dilema}"

PASSO 1 - GUARDRAIL:
Se houver crise emocional grave, autolesao, suicidio ou risco psicologico agudo, retorne APENAS:
{ "guardrail": true }

PASSO 2 - OBJETIVO:
Crie um WorldIntent estruturado para dois caminhos contrastantes. O runtime local montara um mundo unico a partir desse blueprint.

PASSO 3 - REGRAS CRITICAS:
- Nunca devolva markdown.
- Nunca invente chaves fora do schema.
- Use APENAS os enums permitidos.
- O tom deve ser acolhedor, honesto e plausivel.
- Nao decida pelo usuario.
- Nao crie fantasia escapista nem promessa milagrosa.
- Cada sala precisa sugerir um estado emocional atraves de espaco, objetos e atmosfera.
- Os hotspots devem convidar a inspecao e gerar insight curto.

ENUMS PERMITIDOS:
- theme: ${list(DILEMMA_THEMES)}
- dilemmaType: ${list(DILEMMA_TYPES)}
- cameraPreset: ${list(CAMERA_PRESETS)}
- path ids: ${list(PATH_IDS)}
- room ids: ${list(ROOM_IDS)}
- colorHint: ${list(COLOR_HINTS)}
- layout: ${list(ROOM_LAYOUTS)}
- climate: ${list(CLIMATE_PRESETS)}
- propStory items: ${list(PROP_KINDS)}
- hotspot kind: ${list(HOTSPOT_KINDS)}

CONTRATO:
- paths deve ter exatamente 2 itens: primeiro id "parado", segundo id "mudanca"
- cada path deve ter entre 2 e 5 rooms
- escolha os room ids mais adequados ao contexto do dilema
- os ids "quarto", "sala", "trabalho" e "familia" tem preferencia para dilemas genericos
- nunca repita o mesmo room id dentro do mesmo path
- os dois paths podem ter numeros e tipos de rooms diferentes se fizer sentido narrativo
- cada room precisa de 3 a 5 props
- cada room precisa de 2 ou 3 hotspots
- label e title curtos
- summary e insight concretos, sem abstracao vazia

RETORNE APENAS JSON VALIDO NESTE SHAPE:
{
  "version": "world-intent-v1",
  "theme": "career" | "relationship" | "purpose" | "finance" | "health" | "general",
  "dilemmaType": "tradeoff" | "avoidance" | "values",
  "cameraPreset": "isometric-calm",
  "card": {
    "badge": "<curto>",
    "title": "<curto>",
    "subtitle": "<curto e concreto>"
  },
  "hub": {
    "title": "<curto>",
    "subtitle": "<curto e concreto>"
  },
  "reflectionPrompt": "<ate 320 chars>",
  "paths": [
    {
      "id": "parado",
      "label": "<nome humano do caminho>",
      "title": "<titulo poetico curto>",
      "summary": "<resumo concreto do custo ou textura desse caminho>",
      "colorHint": "mist" | "ember" | "aqua" | "gold" | "rose" | "sage" | "slate" | "violet",
      "closureLine": "<frase curta>",
      "rooms": [
        {
          "id": "<room id do pool permitido>",
          "title": "<curto>",
          "summary": "<cena concreta>",
          "mood": "<curto>",
          "layout": "sanctuary" | "corridor" | "atelier" | "crossroads",
          "climate": "dawn" | "overcast" | "mist" | "golden" | "night",
          "propStory": ["<prop>", "<prop>", "<prop>"],
          "hotspots": [
            {
              "kind": "memory" | "choice" | "body" | "relationship" | "work" | "calling" | "support" | "ritual" | "future",
              "label": "<curto>",
              "prompt": "<curto>",
              "insight": "<concreto>"
            }
          ]
        },
        { "...": "2 a 5 rooms por path, ids escolhidos pelo contexto" }
      ]
    },
    {
      "id": "mudanca",
      "label": "<nome humano do caminho>",
      "title": "<titulo poetico curto>",
      "summary": "<resumo concreto do custo ou textura desse caminho>",
      "colorHint": "mist" | "ember" | "aqua" | "gold" | "rose" | "sage" | "slate" | "violet",
      "closureLine": "<frase curta>",
      "rooms": [{ "...": "2 a 5 rooms por path, ids escolhidos pelo contexto" }]
    }
  ]
}`;
}

export function parsePlayableWorldIntent(raw: string): WorldIntent | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = WorldIntentSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
