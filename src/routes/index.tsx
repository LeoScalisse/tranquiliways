import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { useRef, useState } from "react";

import {
  WorldCreationLoader,
  type WorldCreationStageId,
} from "@/components/world-creation-loader";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { TranquiliWaysTitle } from "@/components/ui/tranquili-ways-title";
import { CharacterCustomizer } from "@/components/character-customizer.tsx";
import { useWays } from "@/hooks/use-ways";
import { createJourneySession } from "@/lib/journey-api";

export const Route = createFileRoute("/")({
  component: Index,
});

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function Index() {
  const [interacting, setInteracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationStage, setCreationStage] = useState<WorldCreationStageId>("preparing");
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const rawInputRef = useRef("");
  const { saveWaySession } = useWays();
  const navigate = useNavigate();

  async function handleSend(message: string) {
    const rawInput = message.trim();

    if (!rawInput || isSubmitting) return;

    if (rawInput.startsWith("[Voice message -")) {
      setFeedback("Use texto por enquanto. A captura de voz chegará em breve.");
      return;
    }

    rawInputRef.current = rawInput;
    setFeedback(null);
    setCreationStage("preparing");
    setGenerationStartedAt(Date.now());
    setIsSubmitting(true);

    try {
      setCreationStage("generating");
      const result = await createJourneySession({ rawInput, inputMode: "text" });

      setCreationStage("receiving");
      await sleep(600);

      if ("guardrail" in result) {
        setFeedback(result.mensagem);
        return;
      }

      setCreationStage("saving");
      saveWaySession(result);
      await sleep(500);

      setCreationStage("opening");
      await sleep(700);

      await navigate({ to: "/ways" });
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Nao foi possivel gerar seu mundo agora. Tente novamente em instantes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitting) {
    return (
      <div className="relative min-h-svh overflow-hidden">
        <WorldCreationLoader
          dilemma={rawInputRef.current}
          stage={creationStage}
          startedAt={generationStartedAt ?? undefined}
        />
      </div>
    );
  }

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="absolute left-4 top-4 z-10">
        <LiquidGlassButton to="/ways" label="Ways" />
      </div>

      <div className="absolute right-4 top-4 z-10">
        <button
          type="button"
          onClick={() => setShowCustomizer(true)}
          className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-sky-950/72 transition hover:bg-white/80"
        >
          Personagem
        </button>
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col items-center justify-start gap-8 px-4 pt-[20svh]">
        <div style={{ animation: "stagger-reveal 0.5s var(--ease-out-strong) both" }}>
          <TranquiliWaysTitle shimmerActive={!interacting} />
        </div>

        <p
          className="max-w-sm text-center text-base text-sky-950/55 leading-7"
          style={{ animation: "stagger-reveal 0.5s var(--ease-out-strong) both 0.08s" }}
        >
          Descreva um dilema da sua vida. A IA vai gerar um mundo visual com os dois caminhos que
          você pode seguir.
        </p>

        <div
          className="w-full"
          onFocusCapture={() => setInteracting(true)}
          onBlurCapture={() => setInteracting(false)}
          style={{ animation: "stagger-reveal 0.5s var(--ease-out-strong) both 0.16s" }}
        >
          <PromptInputBox
            isLoading={isSubmitting}
            placeholder="Qual é o seu dilema?"
            className="rounded-[1.75rem] border-white/30 bg-white/75 shadow-[0_18px_44px_rgba(30,76,112,0.12)]"
            onSend={(message) => {
              void handleSend(message);
            }}
          />

          {feedback && !isSubmitting ? (
            <p className="mt-4 px-4 text-center text-sm text-sky-950/70">{feedback}</p>
          ) : null}
        </div>

        <p
          className="text-xs text-sky-950/35"
          style={{ animation: "stagger-reveal 0.5s var(--ease-out-strong) both 0.24s" }}
        >
          3 gerações gratuitas por semana
        </p>
      </div>

      <AnimatePresence>
        {showCustomizer && (
          <CharacterCustomizer onClose={() => setShowCustomizer(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
