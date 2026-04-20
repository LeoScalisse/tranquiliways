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

    if (!rawInput || isSubmitting) {
      return;
    }

    if (rawInput.startsWith("[Voice message -")) {
      setFeedback("Use texto aqui por enquanto. A captura de voz continua no fluxo nativo do Android.");
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const session = await createJourneySession({
        rawInput,
        inputMode: "text",
      });

      addWay(rawInput);

      navigate({
        to: "/ways/$sessionId",
        params: { sessionId: session.id },
        search: { token: session.launchToken },
      });
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Nao foi possivel preparar sua jornada agora. Tente novamente em instantes.",
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

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col items-center justify-start gap-12 px-4 pt-[22svh]">
        <TranquiliWaysTitle shimmerActive={!interacting} />

        <div
          className="w-full"
          onFocusCapture={() => setInteracting(true)}
          onBlurCapture={() => setInteracting(false)}
        >
          <PromptInputBox
            isLoading={isSubmitting}
            placeholder="Como voce quer se sentir hoje?"
            className="rounded-[1.75rem] border-white/30 bg-white/75 shadow-[0_18px_44px_rgba(30,76,112,0.12)]"
            onSend={(message) => {
              void handleSend(message);
            }}
          />

          {feedback ? (
            <p className="mt-4 px-4 text-center text-sm text-sky-950/70">{feedback}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
