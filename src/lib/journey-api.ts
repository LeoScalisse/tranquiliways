import type { JourneyInputMode, JourneySession } from "./journey-session";

export interface DilemmaGuardrail {
  guardrail: true;
  mensagem: string;
}

export type CreateSessionResult = JourneySession | DilemmaGuardrail;

interface CreateJourneySessionInput {
  rawInput: string;
  inputMode: JourneyInputMode;
  answers?: { question: string; answer: string }[];
}

interface JourneySessionLookup {
  id: string;
  launchToken: string;
}

export interface DilemmaQuestionsResult {
  perguntas: string[];
}

export async function fetchDilemmaQuestions(
  dilemma: string,
): Promise<DilemmaQuestionsResult | DilemmaGuardrail> {
  try {
    const response = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dilemma }),
    });

    if (!response.ok) return { perguntas: [] };

    const data = (await response.json()) as DilemmaQuestionsResult | { guardrail: true };

    if ("guardrail" in data && data.guardrail) {
      return {
        guardrail: true,
        mensagem:
          "Esse momento parece maior do que o TranquiliWays consegue acompanhar. " +
          "Isso não é fraqueza — é sinal de que você merece suporte real.\n\n" +
          "Considere conversar com alguém de confiança, um profissional de saúde mental, " +
          "ou ligue para o CVV: 188.",
      };
    }

    return data as DilemmaQuestionsResult;
  } catch {
    return { perguntas: [] };
  }
}

export async function createJourneySession(
  input: CreateJourneySessionInput,
): Promise<CreateSessionResult> {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readJourneyApiError(response, "Nao foi possivel forjar sua jornada."));
  }

  const data = (await response.json()) as JourneySession | { guardrail: true; mensagem: string };

  if ("guardrail" in data && data.guardrail) {
    return data as DilemmaGuardrail;
  }

  return data as JourneySession;
}

export async function getJourneySession(lookup: JourneySessionLookup): Promise<JourneySession> {
  const response = await fetch(`/api/sessions/${encodeURIComponent(lookup.id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ launchToken: lookup.launchToken }),
  });

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
