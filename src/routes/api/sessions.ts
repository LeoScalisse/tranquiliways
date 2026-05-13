import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { generateJourneyWorld } from "@/lib/generate-journey-world";
import { issueJourneySession } from "@/lib/journey-session";
import { resolveCreateJourneySessionError } from "@/lib/session-request-error";

const createJourneySessionSchema = z.object({
  rawInput: z.string().trim().min(1).max(1200),
  inputMode: z.enum(["text", "voice"]),
  answers: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .max(3)
    .optional()
    .default([]),
});

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
          const worldOrGuardrail = await generateJourneyWorld(rawInput, answers);

          if ("guardrail" in worldOrGuardrail) {
            return Response.json(worldOrGuardrail, { status: 200 });
          }

          const session = await issueJourneySession({
            rawInput,
            inputMode,
            world: worldOrGuardrail.world,
            generationSource: worldOrGuardrail.generationSource,
            generationWarning: worldOrGuardrail.generationWarning,
          });

          return Response.json(session, { status: 201 });
        } catch (error) {
          console.error("Falha ao criar sessao da jornada.", error);
          const response = resolveCreateJourneySessionError(error);
          return Response.json(response.body, { status: response.status });
        }
      },
    },
  },
});
