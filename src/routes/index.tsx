import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { TranquiliWaysTitle } from "@/components/ui/tranquili-ways-title";
import { useWays } from "@/hooks/use-ways";
import { createJourneySession } from "@/lib/journey-api";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [interacting, setInteracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { addWay } = useWays();
  const navigate = useNavigate();

  async function handleSend(message: string) {
    const rawInput = message.trim();

    if (!rawInput || isSubmitting) return;

    if (rawInput.startsWith("[Voice message -")) {
      setFeedback("Use texto por enquanto. A captura de voz chegará em breve.");
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const session = await createJourneySession({ rawInput, inputMode: "text" });
      addWay(rawInput, session.world);

      navigate({
        to: "/ways/$sessionId",
        params: { sessionId: session.id },
        search: { token: session.launchToken },
      });
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

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="absolute left-4 top-4 z-10">
        <LiquidGlassButton to="/ways" />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col items-center justify-start gap-8 px-4 pt-[20svh]">
        <TranquiliWaysTitle shimmerActive={!interacting} />

        <p className="max-w-sm text-center text-base text-sky-950/55 leading-7">
          Descreva um dilema da sua vida. A IA vai gerar um mundo visual com os dois caminhos que você pode seguir.
        </p>

        <div
          className="w-full"
          onFocusCapture={() => setInteracting(true)}
          onBlurCapture={() => setInteracting(false)}
        >
          <PromptInputBox
            isLoading={isSubmitting}
            placeholder="Qual é o seu dilema?"
            className="rounded-[1.75rem] border-white/30 bg-white/75 shadow-[0_18px_44px_rgba(30,76,112,0.12)]"
            onSend={(message) => { void handleSend(message); }}
          />

          {isSubmitting && (
            <p className="mt-4 px-4 text-center text-sm text-sky-950/60 animate-pulse">
              Construindo os seus caminhos...
            </p>
          )}

          {feedback && !isSubmitting ? (
            <p className="mt-4 px-4 text-center text-sm text-sky-950/70">{feedback}</p>
          ) : null}
        </div>

        <p className="text-xs text-sky-950/35">3 gerações gratuitas por semana</p>
      </div>
    </div>
  );
}
