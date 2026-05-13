export interface CreateJourneySessionErrorResponse {
  status: number;
  body: {
    error: string;
    message: string;
  };
}

const INVALID_JSON_RESPONSE: CreateJourneySessionErrorResponse = {
  status: 400,
  body: {
    error: "invalid_json",
    message: "Nao foi possivel processar o dilema enviado.",
  },
};

const SESSION_SECRET_MISSING_RESPONSE: CreateJourneySessionErrorResponse = {
  status: 500,
  body: {
    error: "session_secret_missing",
    message: "A configuracao da sessao nao foi carregada no servidor.",
  },
};

const GENERIC_FAILURE_RESPONSE: CreateJourneySessionErrorResponse = {
  status: 500,
  body: {
    error: "session_creation_failed",
    message: "Nao foi possivel gerar seu mundo agora. Tente novamente em instantes.",
  },
};

export function resolveCreateJourneySessionError(
  error: unknown,
): CreateJourneySessionErrorResponse {
  if (error instanceof SyntaxError) {
    return INVALID_JSON_RESPONSE;
  }

  if (
    error instanceof Error &&
    error.message.includes("TRANQUILIWAYS_SESSION_SECRET")
  ) {
    return SESSION_SECRET_MISSING_RESPONSE;
  }

  return GENERIC_FAILURE_RESPONSE;
}
