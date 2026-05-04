import assert from "node:assert/strict";

import { createWorldIntentFixture } from "../../features/playable-world/__tests__/fixtures.ts";
import { generateJourneyWorld, JOURNEY_GUARDRAIL_MESSAGE } from "../generate-journey-world.ts";
import { isPlayableWorld } from "../journey-world.ts";

async function run(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await run("generateJourneyWorld usa fallback quando Groq nao esta disponivel", async () => {
  const result = await generateJourneyWorld("Devo mudar de carreira?", [], {
    isGroqAvailable: () => false,
    callGroq: async () => {
      throw new Error("nao deveria chamar Groq");
    },
  });

  assert.equal("guardrail" in result, false);
  if ("guardrail" in result) {
    return;
  }

  assert.equal(result.generationSource, "fallback");
  assert.equal(result.generationWarning, "groq_unavailable");
  assert.equal(isPlayableWorld(result.world), true);
});

await run("generateJourneyWorld marca quota esgotada quando Groq devolve 429", async () => {
  const result = await generateJourneyWorld("Devo mudar de carreira?", [], {
    isGroqAvailable: () => true,
    callGroq: async () => {
      throw new Error('Groq API 429: {"error":{"message":"Rate limit exceeded"}}');
    },
  });

  assert.equal("guardrail" in result, false);
  if ("guardrail" in result) {
    return;
  }

  assert.equal(result.generationSource, "fallback");
  assert.equal(result.generationWarning, "groq_quota_exhausted");
  assert.equal(isPlayableWorld(result.world), true);
});

await run("generateJourneyWorld cai em fallback quando o JSON nao segue o schema esperado", async () => {
  const result = await generateJourneyWorld("Devo mudar de carreira?", [], {
    isGroqAvailable: () => true,
    callGroq: async () => JSON.stringify({ titulo: "invalido" }),
  });

  assert.equal("guardrail" in result, false);
  if ("guardrail" in result) {
    return;
  }

  assert.equal(result.generationSource, "fallback");
  assert.equal(result.generationWarning, "groq_invalid_response");
  assert.equal(isPlayableWorld(result.world), true);
});

await run("generateJourneyWorld preserva guardrail quando a Groq sinaliza risco", async () => {
  const result = await generateJourneyWorld("Nao quero mais continuar", [], {
    isGroqAvailable: () => true,
    callGroq: async () => JSON.stringify({ guardrail: true }),
  });

  assert.equal("guardrail" in result, true);
  if (!("guardrail" in result)) {
    return;
  }

  assert.equal(result.guardrail, true);
  assert.equal(result.mensagem, JOURNEY_GUARDRAIL_MESSAGE);
});

await run("generateJourneyWorld retorna mundo Groq quando a resposta e valida", async () => {
  const result = await generateJourneyWorld("Devo mudar de carreira?", [], {
    isGroqAvailable: () => true,
    callGroq: async () => JSON.stringify(createWorldIntentFixture()),
  });

  assert.equal("guardrail" in result, false);
  if ("guardrail" in result) {
    return;
  }

  assert.equal(result.generationSource, "groq");
  assert.equal(result.generationWarning, undefined);
  assert.equal(isPlayableWorld(result.world), true);
});
