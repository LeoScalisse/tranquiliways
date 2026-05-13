import assert from "node:assert/strict";

import { resolveCreateJourneySessionError } from "../session-request-error.ts";

async function run(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await run("resolveCreateJourneySessionError trata JSON invalido como erro 400", () => {
  const result = resolveCreateJourneySessionError(new SyntaxError("Unexpected token"));

  assert.deepEqual(result, {
    status: 400,
    body: {
      error: "invalid_json",
      message: "Nao foi possivel processar o dilema enviado.",
    },
  });
});

await run(
  "resolveCreateJourneySessionError destaca configuracao ausente do segredo da sessao",
  () => {
    const result = resolveCreateJourneySessionError(
      new Error(
        "TRANQUILIWAYS_SESSION_SECRET nao esta configurada. Defina essa variavel de ambiente antes de iniciar o servidor.",
      ),
    );

    assert.deepEqual(result, {
      status: 500,
      body: {
        error: "session_secret_missing",
        message: "A configuracao da sessao nao foi carregada no servidor.",
      },
    });
  },
);

await run("resolveCreateJourneySessionError usa fallback generico para falhas internas", () => {
  const result = resolveCreateJourneySessionError(new Error("unexpected failure"));

  assert.deepEqual(result, {
    status: 500,
    body: {
      error: "session_creation_failed",
      message: "Nao foi possivel gerar seu mundo agora. Tente novamente em instantes.",
    },
  });
});
