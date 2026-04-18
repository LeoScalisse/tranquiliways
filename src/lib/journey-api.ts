import type { JourneyInputMode, JourneySession } from "./journey-session";

interface CreateJourneySessionInput {
  rawInput: string;
  inputMode: JourneyInputMode;
}

interface JourneySessionLookup {
  id: string;
  launchToken: string;
}

export async function createJourneySession(
  input: CreateJourneySessionInput,
): Promise<JourneySession> {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readJourneyApiError(response, "Nao foi possivel forjar sua jornada."));
  }

  return (await response.json()) as JourneySession;
}

export async function getJourneySession(
  lookup: JourneySessionLookup,
): Promise<JourneySession> {
  const response = await fetch(
    `/api/sessions/${encodeURIComponent(lookup.id)}?token=${encodeURIComponent(lookup.launchToken)}`,
  );

  if (!response.ok) {
    throw new Error(
      await readJourneyApiError(response, "Nao foi possivel preparar seu TranquiliWay."),
    );
  }

  return (await response.json()) as JourneySession;
}

async function readJourneyApiError(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };

    return payload.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}
