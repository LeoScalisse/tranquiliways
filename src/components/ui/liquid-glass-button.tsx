import React, { useRef, useCallback } from "react";
import { motion, useSpring } from "motion/react";
import { Cloud } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function LiquidGlassButton() {
  return (
    <Link to="/ways">
      <motion.div
        className="relative cursor-pointer flex flex-col items-center"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Cloud icon - fully transparent, no background/border */}
        <Cloud
          size={28}
          strokeWidth={1.8}
          style={{
            color: "rgba(255,255,255,0.85)",
            filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.12))",
          }}
        />
        {/* Two dots below like a thought/speech bubble */}
        <div className="flex flex-col items-center" style={{ marginTop: 2 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.7)",
              marginBottom: 2,
            }}
          />
          <div
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.5)",
            }}
          />
        </div>
      </motion.div>
    </Link>
  );
}
