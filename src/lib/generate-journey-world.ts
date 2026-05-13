import { compileWorldIntent } from "../features/playable-world/compiler.ts";
import { buildFallbackWorldIntent } from "../features/playable-world/fallback.ts";
import {
  buildPlayableWorldPrompt,
  GeminiPlayableGuardrailSchema,
  parsePlayableWorldIntent,
} from "../features/playable-world/generation.ts";
import { callGemini, isGeminiAvailable } from "./gemini.ts";
import type { JourneyGenerationSource, JourneyGenerationWarning } from "./journey-session.ts";
import type { JourneyWorld } from "./journey-world.ts";

const GEMINI_WORLD_GENERATION_OPTIONS = {
  maxOutputTokens: 24576,
  temperature: 0.45,
  thinkingBudget: 0,
} as const;

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
  isGeminiAvailable: typeof isGeminiAvailable;
  callGemini: typeof callGemini;
}

const defaultDependencies: GenerateJourneyWorldDependencies = {
  isGeminiAvailable,
  callGemini,
};

function buildFallbackWorld(dilema: string, id: string, geradoEm: string): JourneyWorld {
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

function classifyGeminiFailure(error: unknown): JourneyGenerationWarning {
  if (!(error instanceof Error)) {
    return "gemini_unavailable";
  }

  if (error.message.includes("Gemini API 429")) {
    return "gemini_quota_exhausted";
  }

  return "gemini_unavailable";
}

export async function generateJourneyWorld(
  dilema: string,
  answers: { question: string; answer: string }[],
  dependencies: GenerateJourneyWorldDependencies = defaultDependencies,
): Promise<JourneyWorldGenerationResult | JourneyGuardrailResult> {
  const id = crypto.randomUUID();
  const geradoEm = new Date().toISOString();
  const fallbackWorld = buildFallbackWorld(dilema, id, geradoEm);

  if (!dependencies.isGeminiAvailable()) {
    return fallbackResult("gemini_unavailable", fallbackWorld);
  }

  let raw: string;
  try {
    raw = await dependencies.callGemini(
      buildPlayableWorldPrompt(dilema, answers),
      GEMINI_WORLD_GENERATION_OPTIONS,
    );
  } catch (error) {
    console.error("[generateJourneyWorld] Gemini failed:", error);
    return fallbackResult(classifyGeminiFailure(error), fallbackWorld);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error("Resposta da Gemini nao retornou JSON valido.", error);
    return fallbackResult("gemini_invalid_response", fallbackWorld);
  }

  const guardrailCheck = GeminiPlayableGuardrailSchema.safeParse(parsed);
  if (guardrailCheck.success) {
    return { guardrail: true, mensagem: JOURNEY_GUARDRAIL_MESSAGE };
  }

  const intent = parsePlayableWorldIntent(raw);
  if (!intent) {
    console.error(
      "[generateJourneyWorld] Gemini response failed WorldIntent schema validation. First 500 chars:",
      raw.slice(0, 500),
    );
    return fallbackResult("gemini_invalid_response", fallbackWorld);
  }

  return {
    world: compileWorldIntent({ id, dilema, geradoEm, intent }),
    generationSource: "gemini",
  };
}
