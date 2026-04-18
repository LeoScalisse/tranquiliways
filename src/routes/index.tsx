import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { TranquiliWaysTitle } from "@/components/ui/tranquili-ways-title";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [interacting, setInteracting] = useState(false);

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
            placeholder="Como você quer se sentir hoje?"
            className="rounded-[1.75rem] border-white/30 bg-white/75 shadow-[0_18px_44px_rgba(30,76,112,0.12)]"
            onSend={(message, files) => {
              console.log("Message:", message);
              console.log("Files:", files);
            }}
          />
        </div>
      </div>
    </div>
  );
}
