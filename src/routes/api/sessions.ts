import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { interpretDilemmaFallback, type DilemmaWorld } from "@/lib/interpret-dilemma";
import { issueJourneySession } from "@/lib/journey-session";

const createJourneySessionSchema = z.object({
  rawInput: z.string().trim().min(1).max(1200),
  inputMode: z.enum(["text", "voice"]),
});

// Usa a Claude API para interpretar o dilema e gerar um DilemmaWorld estruturado.
// Cai no fallback heurístico se a chave não estiver configurada.
async function generateDilemmaWorld(dilema: string): Promise<DilemmaWorld> {
  const apiKey = (
    globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.ANTHROPIC_API_KEY;

  const base = interpretDilemmaFallback(dilema);
  const id = crypto.randomUUID();
  const geradoEm = new Date().toISOString();

  if (!apiKey) {
    return { ...base, id, geradoEm };
  }

  const systemPrompt = `Você é um motor de geração de mundos emocionais narrativos para o TranquiliWays.
Dado o dilema de vida de um usuário, você gera um JSON estruturado com dois caminhos:
1. "caminhoParado": o que acontece se a pessoa ficar parada, não mudar nada
2. "caminhoMudanca": o que acontece se a pessoa tomar a decisão de mudança

Cada caminho tem 4 ambientes (quarto, sala, trabalho, familia) que mostram como o dilema se manifesta naquele espaço através de environmental storytelling — sem texto explicativo, só elementos concretos e descrições visuais evocativas.

RESPONDA APENAS COM JSON VÁLIDO. Nenhum texto antes ou depois.

Estrutura obrigatória:
{
  "caminhoParado": {
    "nome": "Ficou parado",
    "titulo": "<título poético curto>",
    "tom": "<um de: arrependimento|esperanca|ansiedade|paz|solidao|conexao|estagnacao|transformacao>",
    "corDominante": "<hex>",
    "gradiente": ["<hex topo>", "<hex base>"],
    "ambientes": {
      "quarto": { "descricao": "<cena visual>", "elementos": ["<elemento 1>", "<elemento 2>", "<elemento 3>"], "cor": "<hex>", "humor": "<label curto>" },
      "sala":   { "descricao": "<cena visual>", "elementos": ["<elemento 1>", "<elemento 2>", "<elemento 3>"], "cor": "<hex>", "humor": "<label curto>" },
      "trabalho": { "descricao": "<cena visual>", "elementos": ["<elemento 1>", "<elemento 2>", "<elemento 3>"], "cor": "<hex>", "humor": "<label curto>" },
      "familia":  { "descricao": "<cena visual>", "elementos": ["<elemento 1>", "<elemento 2>", "<elemento 3>"], "cor": "<hex>", "humor": "<label curto>" }
    }
  },
  "caminhoMudanca": { <mesma estrutura> }
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Dilema: "${dilema}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return { ...base, id, geradoEm };
    }

    const result = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };
    const text = result.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = JSON.parse(text) as Pick<DilemmaWorld, "caminhoParado" | "caminhoMudanca">;

    return {
      id,
      dilema,
      geradoEm,
      caminhoParado: parsed.caminhoParado,
      caminhoMudanca: parsed.caminhoMudanca,
    };
  } catch {
    return { ...base, id, geradoEm };
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

          const world = await generateDilemmaWorld(result.data.rawInput);
          const session = await issueJourneySession({
            rawInput: result.data.rawInput,
            inputMode: result.data.inputMode,
            world,
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
