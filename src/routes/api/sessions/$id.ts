import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

import { verifyJourneySessionToken } from "@/lib/journey-session";

export const Route = createFileRoute("/api/sessions/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const token = new URL(request.url).searchParams.get("token");

        if (!token) {
          return Response.json(
            {
              error: "missing_launch_token",
              message: "O launch token e obrigatorio para abrir esta sessao.",
            },
            { status: 400 },
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
