const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getGroqApiKey(): string | undefined {
  return (
    globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.GROQ_API_KEY;
}

export function isGroqAvailable(): boolean {
  return Boolean(getGroqApiKey());
}

export async function callGroq(prompt: string, maxOutputTokens = 2048): Promise<string> {
  const apiKey = getGroqApiKey();
  if (!apiKey) throw new Error("GROQ_API_KEY nao configurada");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "Responda apenas com JSON valido. Nao use markdown, comentarios ou texto extra.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_object",
      },
      temperature: 0.7,
      max_completion_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API ${response.status}: ${errorText}`);
  }

  const result = (await response.json()) as {
    choices: Array<{ message: { content: string | null } }>;
  };

  const text = result.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Groq retornou resposta vazia");
  }

  return text;
}
