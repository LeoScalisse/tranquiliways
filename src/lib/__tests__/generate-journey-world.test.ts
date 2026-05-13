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

async function withSilencedConsoleError<T>(fn: () => Promise<T>): Promise<T> {
  const originalError = console.error;
  console.error = () => {};

  try {
    return await fn();
  } finally {
    console.error = originalError;
  }
}

await run("generateJourneyWorld usa fallback quando Gemini nao esta disponivel", async () => {
  const result = await generateJourneyWorld("Devo mudar de carreira?", [], {
    isGeminiAvailable: () => false,
    callGemini: async () => {
      throw new Error("nao deveria chamar Gemini");
    },
  });

  assert.equal("guardrail" in result, false);
  if ("guardrail" in result) {
    return;
  }

  assert.equal(result.generationSource, "fallback");
  assert.equal(result.generationWarning, "gemini_unavailable");
  assert.equal(isPlayableWorld(result.world), true);
});

await run("generateJourneyWorld marca quota esgotada quando Gemini devolve 429", async () => {
  const result = await withSilencedConsoleError(() =>
    generateJourneyWorld("Devo mudar de carreira?", [], {
      isGeminiAvailable: () => true,
      callGemini: async () => {
        throw new Error('Gemini API 429: {"error":{"message":"Rate limit exceeded"}}');
      },
    }),
  );

  assert.equal("guardrail" in result, false);
  if ("guardrail" in result) {
    return;
  }

  assert.equal(result.generationSource, "fallback");
  assert.equal(result.generationWarning, "gemini_quota_exhausted");
  assert.equal(isPlayableWorld(result.world), true);
});

await run(
  "generateJourneyWorld cai em fallback quando o JSON nao segue o schema esperado",
  async () => {
    const result = await withSilencedConsoleError(() =>
      generateJourneyWorld("Devo mudar de carreira?", [], {
        isGeminiAvailable: () => true,
        callGemini: async () => JSON.stringify({ titulo: "invalido" }),
      }),
    );

    assert.equal("guardrail" in result, false);
    if ("guardrail" in result) {
      return;
    }

    assert.equal(result.generationSource, "fallback");
    assert.equal(result.generationWarning, "gemini_invalid_response");
    assert.equal(isPlayableWorld(result.world), true);
  },
);

await run("generateJourneyWorld preserva guardrail quando a Gemini sinaliza risco", async () => {
  const result = await generateJourneyWorld("Nao quero mais continuar", [], {
    isGeminiAvailable: () => true,
    callGemini: async () => JSON.stringify({ guardrail: true }),
  });

  assert.equal("guardrail" in result, true);
  if (!("guardrail" in result)) {
    return;
  }

  assert.equal(result.guardrail, true);
  assert.equal(result.mensagem, JOURNEY_GUARDRAIL_MESSAGE);
});

await run("generateJourneyWorld retorna mundo Gemini quando a resposta e valida", async () => {
  const result = await generateJourneyWorld("Devo mudar de carreira?", [], {
    isGeminiAvailable: () => true,
    callGemini: async () => JSON.stringify(createWorldIntentFixture()),
  });

  assert.equal("guardrail" in result, false);
  if ("guardrail" in result) {
    return;
  }

  assert.equal(result.generationSource, "gemini");
  assert.equal(result.generationWarning, undefined);
  assert.equal(isPlayableWorld(result.world), true);
});

await run("generateJourneyWorld envia budget amplo para blueprint jogavel", async () => {
  let capturedOptions: unknown;

  const result = await generateJourneyWorld("Devo mudar de carreira?", [], {
    isGeminiAvailable: () => true,
    callGemini: async (_prompt, options) => {
      capturedOptions = options;
      return JSON.stringify(createWorldIntentFixture());
    },
  });

  assert.equal("guardrail" in result, false);
  assert.deepEqual(capturedOptions, {
    maxOutputTokens: 24576,
    temperature: 0.45,
    thinkingBudget: 0,
  });
});

await run("generateJourneyWorld aceita WorldIntent envelopado pela Gemini", async () => {
  const result = await generateJourneyWorld("Devo mudar de carreira?", [], {
    isGeminiAvailable: () => true,
    callGemini: async () => JSON.stringify({ world: createWorldIntentFixture() }),
  });

  assert.equal("guardrail" in result, false);
  if ("guardrail" in result) {
    return;
  }

  assert.equal(result.generationSource, "gemini");
  assert.equal(result.generationWarning, undefined);
  assert.equal(isPlayableWorld(result.world), true);
});

await run("generateJourneyWorld normaliza props comuns que a Gemini devolve fora do enum", async () => {
  const intent = createWorldIntentFixture() as unknown as {
    paths: Array<{ rooms: Array<{ propStory: string[] }> }>;
  };
  intent.paths[0].rooms[2].propStory = ["desk", "chair", "computer", "mug"];
  intent.paths[1].rooms[2].propStory = ["desk", "computer", "lamp", "mug"];

  const result = await generateJourneyWorld("Devo mudar de carreira?", [], {
    isGeminiAvailable: () => true,
    callGemini: async () => JSON.stringify(intent),
  });

  assert.equal("guardrail" in result, false);
  if ("guardrail" in result) {
    return;
  }

  assert.equal(result.generationSource, "gemini");
  assert.equal(result.generationWarning, undefined);
  assert.equal(isPlayableWorld(result.world), true);
  assert.equal(
    result.world.paths.some((path) =>
      path.rooms.some((room) => room.props.some((prop) => prop.kind === ("computer" as never))),
    ),
    false,
  );
});
