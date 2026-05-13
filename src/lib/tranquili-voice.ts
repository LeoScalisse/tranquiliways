import { TranquiliNative, isNativeAndroidRuntime } from "./tranquili-native.ts";

export function isNativeJourneyVoiceAvailable(): boolean {
  return isNativeAndroidRuntime();
}

export async function requestJourneyVoiceTranscription(): Promise<string> {
  if (!isNativeJourneyVoiceAvailable()) {
    throw new Error("A voz nativa esta disponivel apenas no Android nesta fase.");
  }

  const result = await TranquiliNative.transcribeOnce({
    language: "pt-BR",
    prompt: "Fale seu TranquiliWay",
  });
  const transcript = result.transcript.trim();

  if (!transcript) {
    throw new Error("Nenhuma fala foi reconhecida. Tente novamente ou escreva seu prompt.");
  }

  return transcript;
}
