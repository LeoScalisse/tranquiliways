import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Cloud } from "lucide-react";
import { motion } from "motion/react";
import StackedPanels from "@/components/ui/stacked-panels";

export const Route = createFileRoute("/ways")({
  component: WaysPage,
});

function WaysPage() {
  return (
    <div
      className="min-h-screen px-4 py-6 flex flex-col"
      style={{
        background: "linear-gradient(135deg, #5cc3ff 0%, #4ab8f0 35%, #a8d8f0 60%, #f5e6a3 100%)",
      }}
    >
      {/* Header */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)",
                backdropFilter: "blur(16px) saturate(1.8)",
                WebkitBackdropFilter: "blur(16px) saturate(1.8)",
                border: "1px solid rgba(255,255,255,0.35)",
                boxShadow: "0 4px 24px rgba(92,195,255,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            >
              <ArrowLeft size={18} style={{ color: "rgba(255,255,255,0.9)" }} />
            </motion.div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-50">
            Meus Ways
          </h1>
          <Cloud size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
        </div>
      </div>

      {/* Interactive Stacked Panels as Ways */}
      <div className="flex-1 flex items-center justify-center">
        <div style={{ width: "min(100%, 500px)", height: "min(70vh, 500px)" }}>
          <StackedPanels />
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-sm text-white/50">Deslize para explorar seus Ways</p>
      </div>
    </div>
  );
}
