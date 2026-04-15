"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  active?: boolean;
}

export function ShimmerText({
  children,
  className,
  duration = 1.5,
  delay = 1.5,
  active = true,
}: ShimmerTextProps) {
  return (
    <span className={cn("relative inline-block", className)}>
      <span className="relative inline-block">
        <motion.span
          className="absolute inset-0 overflow-hidden"
          style={{
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
          animate={
            active
              ? { backgroundPosition: ["100% 0%", "-100% 0%"] }
              : { backgroundPosition: "100% 0%" }
          }
          transition={
            active
              ? {
                  duration,
                  ease: "linear",
                  repeat: Infinity,
                  repeatDelay: delay,
                }
              : { duration: 0 }
          }
        >
          {children}
        </motion.span>
        <span className="relative">{children}</span>
      </span>
    </span>
  );
}

export default ShimmerText;
