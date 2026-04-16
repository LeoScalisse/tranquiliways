import { motion } from "motion/react";
import { Cloud } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function LiquidGlassButton() {
  return (
    <Link to="/ways">
      <motion.div
        className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer relative"
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
        <Cloud
          size={18}
          strokeWidth={1.8}
          style={{ color: "rgba(255,255,255,0.9)" }}
        />
        {/* Thought bubble dots */}
        <div
          style={{
            position: "absolute",
            bottom: -8,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.6)",
            }}
          />
          <div
            style={{
              width: 2.5,
              height: 2.5,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.4)",
            }}
          />
        </div>
      </motion.div>
    </Link>
  );
}
