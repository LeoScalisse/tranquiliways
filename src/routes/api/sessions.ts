import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { issueJourneySession } from "@/lib/journey-session";

const createJourneySessionSchema = z.object({
  rawInput: z.string().trim().min(1).max(1200),
  inputMode: z.enum(["text", "voice"]),
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
                message: "Envie um texto nao vazio e o tipo de input usado.",
              },
              { status: 400 },
            );
          }

          const session = await issueJourneySession(result.data);

          return Response.json(session, { status: 201 });
        } catch {
          return Response.json(
            {
              error: "invalid_json",
              message: "Nao foi possivel ler os dados enviados para forjar a sessao.",
            },
            { status: 400 },
          );
        }
      },
    },
  },
});
