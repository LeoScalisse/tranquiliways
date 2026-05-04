import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { verifyJourneySessionToken } from "@/lib/journey-session";

const openJourneySessionSchema = z.object({
  launchToken: z.string().min(1),
});

async function readLaunchToken(request: Request): Promise<string | null> {
  if (request.method === "POST") {
    try {
      const payload = await request.json();
      const result = openJourneySessionSchema.safeParse(payload);
      return result.success ? result.data.launchToken : null;
    } catch {
      return null;
    }
  }

  const authHeader = request.headers.get("Authorization");
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

async function openSession(id: string, request: Request) {
  const token = await readLaunchToken(request);

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
    id,
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
}

export const Route = createFileRoute("/api/sessions/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => openSession(params.id, request),
      POST: async ({ params, request }) => openSession(params.id, request),
    },
  },
});
