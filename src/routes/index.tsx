import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { TranquiliWaysTitle } from "@/components/ui/tranquili-ways-title";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [interacting, setInteracting] = useState(false);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #5cc3ff 0%, #ffffff 100%)" }}
    >
      <div className="w-full max-w-2xl">
        <TranquiliWaysTitle shimmerActive={!interacting} />
        <div
          onFocusCapture={() => setInteracting(true)}
          onBlurCapture={() => setInteracting(false)}
        >
          <PromptInputBox
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
