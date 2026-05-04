import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  interpretDilemmaFallback,
  GeminiWorldResponseSchema,
  GeminiGuardrailSchema,
  type DilemmaWorld,
} from "@/lib/interpret-dilemma";
import { callGemini, isGeminiAvailable } from "@/lib/gemini";
import { issueJourneySession } from "@/lib/journey-session";

const createJourneySessionSchema = z.object({
  rawInput: z.string().trim().min(1).max(1200),
  inputMode: z.enum(["text", "voice"]),
  answers: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .max(3)
    .optional()
    .default([]),
});

const GUARDRAIL_MESSAGE =
  "Esse momento parece maior do que o TranquiliWays consegue acompanhar. " +
  "Isso não é fraqueza — é sinal de que você merece suporte real.\n\n" +
  "Considere conversar com alguém de confiança, um profissional de saúde mental, " +
  "ou ligue para o CVV: 188.";

function buildWorldPrompt(
  dilema: string,
  answers: { question: string; answer: string }[],
): string {
  const answersText =
    answers.length > 0
      ? `\nCONTEXTO ADICIONAL:\n${answers.map((a) => `- ${a.question}\n  ${a.answer}`).join("\n")}`
      : "";

  return `Você é o motor de geração de mundos do TranquiliWays, app que ajuda jovens de 18 a 27 anos \
a tornar o futuro tangível através de narrativas visuais emocionais.

DILEMA: "${dilema}"${answersText}

PASSO 1 — GUARDRAIL: Se o dilema envolver crise emocional grave, autolesão, suicídio ou risco \
psicológico agudo, retorne APENAS: { "guardrail": true }

PASSO 2 — CLASSIFIQUE o tipo:
- "tradeoff": dois caminhos válidos com custos e benefícios genuinamente diferentes (ex: mudar de emprego, morar em outra cidade)
- "avoidance": a pessoa sabe o que deve fazer mas está evitando (ex: "sei que preciso estudar mas não consigo começar")
- "values": conflito entre dois valores igualmente importantes (ex: ficar perto da família vs. seguir carreira)

PASSO 3 — GERE OS DOIS CAMINHOS com base no tipo classificado:
- tradeoff: caminhoParado = caminho mais convencional/seguro, caminhoMudanca = caminho alternativo
- avoidance: caminhoParado = continuar evitando (custo honesto e silencioso), caminhoMudanca = dar o primeiro passo (difícil, mas em movimento)
- values: caminhoParado = escolher um valor com o que entrega e o que exige abrir mão, caminhoMudanca = o outro valor com o mesmo nível de honestidade

REGRAS:
- Nunca crie um mundo perfeito e outro fracasso — mostre o que cada caminho REALMENTE implica
- Tom sempre acolhedor, honesto, nunca alarmista nem motivacional exagerado
- O app não decide pela pessoa — nunca sugira qual caminho é melhor
- Cada ambiente usa environmental storytelling: elementos concretos e descrições visuais, sem texto explicativo

RETORNE APENAS JSON VÁLIDO:
{
  "tipo": "tradeoff" | "avoidance" | "values",
  "caminhoParado": {
    "nome": "Ficou parado",
    "titulo": "<título poético curto>",
    "tom": "<arrependimento|esperanca|ansiedade|paz|solidao|conexao|estagnacao|transformacao>",
    "corDominante": "<hex>",
    "gradiente": ["<hex topo>", "<hex base>"],
    "ambientes": {
      "quarto":    { "descricao": "<cena visual>", "elementos": ["<el 1>", "<el 2>", "<el 3>"], "cor": "<hex>", "humor": "<label curto>" },
      "sala":      { "descricao": "<cena visual>", "elementos": ["<el 1>", "<el 2>", "<el 3>"], "cor": "<hex>", "humor": "<label curto>" },
      "trabalho":  { "descricao": "<cena visual>", "elementos": ["<el 1>", "<el 2>", "<el 3>"], "cor": "<hex>", "humor": "<label curto>" },
      "familia":   { "descricao": "<cena visual>", "elementos": ["<el 1>", "<el 2>", "<el 3>"], "cor": "<hex>", "humor": "<label curto>" }
    }
  },
  "caminhoMudanca": { "<mesma estrutura, nome: 'Seguiu em frente'>" }
}`;
}

async function generateDilemmaWorld(
  dilema: string,
  answers: { question: string; answer: string }[],
): Promise<DilemmaWorld | { guardrail: true; mensagem: string }> {
  const id = crypto.randomUUID();
  const geradoEm = new Date().toISOString();
  const fallback = interpretDilemmaFallback(dilema);

  if (!isGeminiAvailable()) {
    return { ...fallback, id, geradoEm };
  }

  try {
    const raw = await callGemini(buildWorldPrompt(dilema, answers));
    const parsed: unknown = JSON.parse(raw);

    const guardrailCheck = GeminiGuardrailSchema.safeParse(parsed);
    if (guardrailCheck.success) {
      return { guardrail: true, mensagem: GUARDRAIL_MESSAGE };
    }

    const worldCheck = GeminiWorldResponseSchema.safeParse(parsed);
    if (!worldCheck.success) {
      console.error("Resposta do Gemini fora do schema esperado:", worldCheck.error.message);
      return { ...fallback, id, geradoEm };
    }

    const { tipo, caminhoParado, caminhoMudanca } = worldCheck.data;
    return { id, dilema, geradoEm, tipoDilema: tipo, caminhoParado, caminhoMudanca };
  } catch (err) {
    console.error("Erro ao chamar Gemini:", err);
    return { ...fallback, id, geradoEm };
  }
}

export const Route = createFileRoute("/api/sessions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = await request.json();
          const result = createJourneySessionSchema.safeParse(payload);

          if (!result.success) {
            return Response.json(
              {
                error: "invalid_session_payload",
                message: "Envie um dilema nao vazio e o tipo de input usado.",
              },
              { status: 400 },
            );
          }

          const { rawInput, inputMode, answers } = result.data;
          const worldOrGuardrail = await generateDilemmaWorld(rawInput, answers);

          if ("guardrail" in worldOrGuardrail) {
            return Response.json(worldOrGuardrail, { status: 200 });
          }

          const session = await issueJourneySession({
            rawInput,
            inputMode,
            world: worldOrGuardrail,
          });

          return Response.json(session, { status: 201 });
        } catch {
          return Response.json(
            {
              error: "invalid_json",
              message: "Nao foi possivel processar o dilema enviado.",
            },
            { status: 400 },
          );
        }
      },
    },
  },
});
