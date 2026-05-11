const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_TIMEOUT_MS = 35_000;

function getProcessEnv(name: string): string | undefined {
  return (
    globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.[name];
}

function getGeminiApiKey(): string | undefined {
  return getProcessEnv("GEMINI_API_KEY");
}

function getGeminiModel(): string {
  return getProcessEnv("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL;
}

export function isGeminiAvailable(): boolean {
  return Boolean(getGeminiApiKey());
}

export async function callGemini(prompt: string, maxOutputTokens = 2048): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY nao configurada");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  const model = encodeURIComponent(getGeminiModel());

  try {
    const response = await fetch(`${GEMINI_API_BASE_URL}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "Responda apenas com JSON valido. Nao use markdown, comentarios ou texto extra.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API ${response.status}: ${errorText}`);
    }

    const result = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");

    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Gemini retornou resposta vazia");
    }

    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}
