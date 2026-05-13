import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { GeminiQuestionsResponseSchema, GeminiGuardrailSchema } from "@/lib/interpret-dilemma";
import { callGemini, isGeminiAvailable } from "@/lib/gemini";

const fetchQuestionsSchema = z.object({
  dilemma: z.string().trim().min(1).max(1200),
});

function buildQuestionsPrompt(dilema: string): string {
  return `Você é o núcleo do TranquiliWays, app que ajuda jovens a explorar dilemas de vida.

DILEMA: "${dilema}"

PASSO 1 — GUARDRAIL: Se o dilema envolver crise emocional grave, autolesão, suicídio ou risco \
psicológico agudo, retorne APENAS: { "guardrail": true }

PASSO 2 — Decida se precisa de mais contexto para gerar mundos precisos e personalizados.
- Se o dilema já tem contexto suficiente, retorne: { "perguntas": [] }
- Se precisar, gere de 1 a 3 perguntas curtas, no tom íntimo de um amigo próximo.
  Foque em: tempo envolvido (há quanto tempo?), influências externas, o que a pessoa já tentou.
  Não pergunte o óbvio que já está no dilema.

RETORNE APENAS JSON VÁLIDO:
{ "perguntas": ["string", "string"] }`;
}

export const Route = createFileRoute("/api/questions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = await request.json();
          const result = fetchQuestionsSchema.safeParse(payload);

          if (!result.success) {
            return Response.json({ perguntas: [] }, { status: 200 });
          }

          if (!isGeminiAvailable()) {
            return Response.json({ perguntas: [] }, { status: 200 });
          }

          const raw = await callGemini(buildQuestionsPrompt(result.data.dilemma), 256);
          const parsed: unknown = JSON.parse(raw);

          const guardrailCheck = GeminiGuardrailSchema.safeParse(parsed);
          if (guardrailCheck.success) {
            return Response.json({ guardrail: true }, { status: 200 });
          }

          const questionsCheck = GeminiQuestionsResponseSchema.safeParse(parsed);
          if (!questionsCheck.success) {
            return Response.json({ perguntas: [] }, { status: 200 });
          }

          return Response.json({ perguntas: questionsCheck.data.perguntas }, { status: 200 });
        } catch {
          // Falha silenciosa — frontend segue sem perguntas
          return Response.json({ perguntas: [] }, { status: 200 });
        }
      },
    },
  },
});
