import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

import { verifyJourneySessionToken } from "@/lib/journey-session";

export const Route = createFileRoute("/api/sessions/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const authHeader = request.headers.get("Authorization");
        const token =
          authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
          return Response.json(
            {
              error: "missing_launch_token",
              message: "O launch token e obrigatorio para abrir esta sessao.",
            },
            { status: 401 },
          );
        }

        const session = await verifyJourneySessionToken({
          id: params.id,
          token,
        });

        if (!session) {
          return Response.json(
            {
              error: "session_not_found",
              message: "Nao foi possivel validar esta sessao.",
            },
            { status: 404 },
          );
        }

        return Response.json(session);
      },
    },
  },
});
