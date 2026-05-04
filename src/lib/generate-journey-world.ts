import { compileWorldIntent } from "../features/playable-world/compiler.ts";
import { buildFallbackWorldIntent } from "../features/playable-world/fallback.ts";
import {
  buildPlayableWorldPrompt,
  GroqPlayableGuardrailSchema,
  parsePlayableWorldIntent,
} from "../features/playable-world/generation.ts";
import { callGroq, isGroqAvailable } from "./groq.ts";
import type {
  JourneyGenerationSource,
  JourneyGenerationWarning,
} from "./journey-session.ts";
import type { JourneyWorld } from "./journey-world.ts";

const GROQ_MAX_OUTPUT_TOKENS = 4096;

export const JOURNEY_GUARDRAIL_MESSAGE =
  "Esse momento parece maior do que o TranquiliWays consegue acompanhar. " +
  "Isso nao e fraqueza - e sinal de que voce merece suporte real.\n\n" +
  "Considere conversar com alguem de confianca, um profissional de saude mental, " +
  "ou ligue para o CVV: 188.";

export interface JourneyGuardrailResult {
  guardrail: true;
  mensagem: string;
}

export interface JourneyWorldGenerationResult {
  world: JourneyWorld;
  generationSource: JourneyGenerationSource;
  generationWarning?: JourneyGenerationWarning;
}

interface GenerateJourneyWorldDependencies {
  isGroqAvailable: typeof isGroqAvailable;
  callGroq: typeof callGroq;
}

const defaultDependencies: GenerateJourneyWorldDependencies = {
  isGroqAvailable,
  callGroq,
};

function buildFallbackWorld(
  dilema: string,
  id: string,
  geradoEm: string,
): JourneyWorld {
  const fallbackIntent = buildFallbackWorldIntent(dilema);
  return compileWorldIntent({ id, dilema, geradoEm, intent: fallbackIntent });
}

function fallbackResult(
  warning: JourneyGenerationWarning,
  world: JourneyWorld,
): JourneyWorldGenerationResult {
  return {
    world,
    generationSource: "fallback",
    generationWarning: warning,
  };
}

function classifyGroqFailure(error: unknown): JourneyGenerationWarning {
  if (!(error instanceof Error)) {
    return "groq_unavailable";
  }

  if (error.message.includes("Groq API 429")) {
    return "groq_quota_exhausted";
  }

  return "groq_unavailable";
}

export async function generateJourneyWorld(
  dilema: string,
  answers: { question: string; answer: string }[],
  dependencies: GenerateJourneyWorldDependencies = defaultDependencies,
): Promise<JourneyWorldGenerationResult | JourneyGuardrailResult> {
  const id = crypto.randomUUID();
  const geradoEm = new Date().toISOString();
  const fallbackWorld = buildFallbackWorld(dilema, id, geradoEm);

  if (!dependencies.isGroqAvailable()) {
    return fallbackResult("groq_unavailable", fallbackWorld);
  }

  let raw: string;
  try {
    raw = await dependencies.callGroq(
      buildPlayableWorldPrompt(dilema, answers),
      GROQ_MAX_OUTPUT_TOKENS,
    );
  } catch (error) {
    console.error("Erro ao chamar Groq:", error);
    return fallbackResult(classifyGroqFailure(error), fallbackWorld);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error("Resposta da Groq nao retornou JSON valido.", error);
    return fallbackResult("groq_invalid_response", fallbackWorld);
  }

  const guardrailCheck = GroqPlayableGuardrailSchema.safeParse(parsed);
  if (guardrailCheck.success) {
    return { guardrail: true, mensagem: JOURNEY_GUARDRAIL_MESSAGE };
  }

  const intent = parsePlayableWorldIntent(raw);
  if (!intent) {
    console.error("Resposta da Groq fora do schema esperado para WorldIntent.");
    return fallbackResult("groq_invalid_response", fallbackWorld);
  }

  return {
    world: compileWorldIntent({ id, dilema, geradoEm, intent }),
    generationSource: "groq",
  };
}
