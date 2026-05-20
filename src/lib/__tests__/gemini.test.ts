import assert from "node:assert/strict";

import { callGemini, isGeminiAvailable } from "../gemini.ts";

async function run(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function installProcessEnv(env: Record<string, string | undefined>) {
  const target = globalThis as Omit<typeof globalThis, "process"> & {
    process?: { env?: Record<string, string | undefined> };
  };
  const previousProcess = target.process;

  target.process = { env };

  return () => {
    target.process = previousProcess;
  };
}

await run("isGeminiAvailable usa GEMINI_API_KEY", () => {
  const restore = installProcessEnv({ GEMINI_API_KEY: "test-key" });

  try {
    assert.equal(isGeminiAvailable(), true);
  } finally {
    restore();
  }
});

await run("callGemini envia prompt para generateContent com JSON mode", async () => {
  const restoreEnv = installProcessEnv({
    GEMINI_API_KEY: "test-key",
    GEMINI_MODEL: "gemini-test-model",
  });
  const originalFetch = globalThis.fetch;
  let capturedUrl: string | undefined;
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: '{"ok":true}' }],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof fetch;

  try {
    const result = await callGemini("Crie um JSON", 321);

    assert.equal(
      capturedUrl,
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-test-model:generateContent",
    );
    assert.equal(capturedInit?.method, "POST");
    assert.deepEqual(capturedInit?.headers, {
      "Content-Type": "application/json",
      "x-goog-api-key": "test-key",
    });

    const body = JSON.parse(String(capturedInit?.body)) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: {
        maxOutputTokens: number;
        responseMimeType: string;
        temperature: number;
      };
      systemInstruction: { parts: Array<{ text: string }> };
    };

    assert.equal(body.contents[0]?.parts[0]?.text, "Crie um JSON");
    assert.equal(body.generationConfig.maxOutputTokens, 321);
    assert.equal(body.generationConfig.responseMimeType, "application/json");
    assert.equal(body.generationConfig.temperature, 0.7);
    assert.match(body.systemInstruction.parts[0]?.text ?? "", /JSON valido/);
    assert.equal(result, '{"ok":true}');
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
});

await run("callGemini aceita configuracao detalhada de geracao", async () => {
  const restoreEnv = installProcessEnv({
    GEMINI_API_KEY: "test-key",
    GEMINI_MODEL: "gemini-test-model",
  });
  const originalFetch = globalThis.fetch;
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedInit = init;
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: '{"ok":true}' }],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof fetch;

  try {
    await callGemini("Crie um mundo", {
      maxOutputTokens: 24576,
      temperature: 0.45,
      thinkingBudget: 0,
    });

    const body = JSON.parse(String(capturedInit?.body)) as {
      generationConfig: {
        maxOutputTokens: number;
        responseMimeType: string;
        temperature: number;
        thinkingConfig?: { thinkingBudget: number };
      };
    };

    assert.equal(body.generationConfig.maxOutputTokens, 24576);
    assert.equal(body.generationConfig.temperature, 0.45);
    assert.deepEqual(body.generationConfig.thinkingConfig, { thinkingBudget: 0 });
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
});

await run("callGemini classifica erros HTTP com status da Gemini", async () => {
  const restoreEnv = installProcessEnv({ GEMINI_API_KEY: "test-key" });
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: { message: "rate limit" } }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;

  try {
    await assert.rejects(() => callGemini("{}", 10), /Gemini API 429/);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
});
