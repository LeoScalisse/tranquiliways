import { useState } from "react";
import { LoaderCircle, Mic, Sparkles, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWays } from "@/hooks/use-ways";
import { createJourneySession } from "@/lib/journey-api";
import type { JourneyInputMode } from "@/lib/journey-session";
import { cn } from "@/lib/utils";
import {
  isNativeJourneyVoiceAvailable,
  requestJourneyVoiceTranscription,
} from "@/lib/tranquili-voice";

const EMPTY_PROMPT_MESSAGE =
  "Escreva ou fale algo que represente o momento que voce quer transformar.";

export function JourneyForgeCard() {
  const [prompt, setPrompt] = useState("");
  const [inputMode, setInputMode] = useState<JourneyInputMode>("text");
  const [isForging, setIsForging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { saveWaySession } = useWays();

  const canForge = prompt.trim().length > 0 && !isForging && !isListening;
  const nativeVoiceReady = isNativeJourneyVoiceAvailable();

  async function handleVoiceCapture() {
    setFeedback(null);
    setIsListening(true);

    try {
      const transcript = await requestJourneyVoiceTranscription();
      setPrompt(transcript);
      setInputMode("voice");
      setFeedback("Sua chama foi ouvida. Ajuste a transcricao se quiser antes de forjar.");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Nao foi possivel ouvir sua fala agora. Voce pode continuar por texto.",
      );
    } finally {
      setIsListening(false);
    }
  }

  async function handleForge() {
    const rawInput = prompt.trim();

    if (!rawInput) {
      setFeedback(EMPTY_PROMPT_MESSAGE);
      return;
    }

    setFeedback(null);
    setIsForging(true);

    try {
      const session = await createJourneySession({
        rawInput,
        inputMode,
      });
      saveWaySession(session);

      window.location.assign(
        `/ways/${encodeURIComponent(session.id)}?token=${encodeURIComponent(session.launchToken)}`,
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "A forja falhou desta vez. Respire e tente novamente.",
      );
    } finally {
      setIsForging(false);
    }
  }

  return (
    <section className="glass-panel rounded-[2rem] p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-sky-950/72">
          <Sparkles className="h-4 w-4" />
          Primeira Chama
        </div>
        <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-sky-950/60">
          <Waves className="h-4 w-4" />
          Input, sessao e mundo 2.5D
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <h2 className="app-heading text-3xl font-semibold text-sky-950 sm:text-4xl">
          Forje o primeiro TranquiliWay.
        </h2>
        <p className="max-w-2xl text-base leading-7 text-sky-950/72">
          Digite ou fale o acontecimento que esta mexendo com voce. Sua fala vira sessao, salva o
          caminho no historico local e abre um mundo 2.5D sereno para revisitar depois.
        </p>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-white/35 bg-white/72 p-4 shadow-[0_18px_44px_rgba(30,76,112,0.12)]">
        <label
          htmlFor="journey-prompt"
          className="mb-3 block text-sm font-medium uppercase tracking-[0.22em] text-sky-950/52"
        >
          Chama inicial
        </label>
        <Textarea
          id="journey-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ex.: Quero parar de viver no automatico e descobrir um caminho com mais sentido."
          className="min-h-[180px] rounded-[1.5rem] border-white/45 bg-white/68 px-5 py-4 text-base leading-7 text-sky-950 shadow-none placeholder:text-sky-950/36 focus-visible:ring-sky-300"
        />

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="glass"
              size="lg"
              onClick={handleVoiceCapture}
              disabled={isListening || isForging || !nativeVoiceReady}
              className={cn(
                "rounded-full px-5 text-sm",
                !nativeVoiceReady && "border-dashed border-sky-200/70 text-sky-950/55",
              )}
            >
              {isListening ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              {isListening ? "Ouvindo..." : "Usar voz no Android"}
            </Button>

            <div className="text-sm text-sky-950/58">
              {nativeVoiceReady
                ? "A transcricao roda no proprio dispositivo."
                : "No desktop e no iOS desta fase, siga por texto."}
            </div>
          </div>

          <Button
            type="button"
            variant="glassProminent"
            size="lg"
            onClick={handleForge}
            disabled={!canForge}
            className="rounded-full px-6 text-sm font-semibold"
          >
            {isForging ? <LoaderCircle className="animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isForging ? "Forjando..." : "Forjar TranquiliWay"}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-sky-950/58">
          <span className="glass-panel rounded-full px-3 py-1.5">Android-first</span>
          <span className="glass-panel rounded-full px-3 py-1.5">Sessao compartilhada</span>
          <span className="glass-panel rounded-full px-3 py-1.5">Historico reabrivel</span>
        </div>

        {feedback ? (
          <div className="mt-4 rounded-2xl border border-sky-200/60 bg-sky-50/75 px-4 py-3 text-sm text-sky-950/72">
            {feedback}
          </div>
        ) : null}
      </div>
    </section>
  );
}
