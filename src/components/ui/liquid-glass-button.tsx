import { motion, useReducedMotion } from "motion/react";
import { Cloud } from "lucide-react";
import { Link, type LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTouchRipple } from "@/hooks/use-touch-ripple";

interface LiquidGlassButtonProps {
  to: LinkProps["to"];
  icon?: LucideIcon;
  label?: string;
  className?: string;
  prominent?: boolean;
  compact?: boolean;
}

export function LiquidGlassButton({
  to,
  icon: Icon = Cloud,
  label,
  className,
  prominent = false,
  compact = false,
}: LiquidGlassButtonProps) {
  const { onPointerDown, rippleElements } = useTouchRipple(
    prominent ? "rgba(3, 105, 161, 0.28)" : "rgba(255, 255, 255, 0.55)",
    72,
  );
  const shouldReduce = useReducedMotion();

  return (
    <Link to={to} style={{ perspective: "600px" }} className="inline-flex">
      {/* Outer 1px gradient border via conic-gradient background + padding */}
      <motion.div
        className="tw-glass-wrap rounded-full"
        style={{ padding: "1px" }}
        whileTap={shouldReduce ? {} : { rotateX: 22 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      >
        <motion.div
          className={cn(
            "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-medium text-white",
            compact ? "h-11 min-w-11 px-3" : "h-12 min-w-12 px-4",
            prominent
              ? "bg-white/26 text-sky-950 shadow-[0_18px_44px_rgba(24,74,116,0.18),inset_0_1px_0_rgba(255,255,255,0.6)]"
              : "bg-white/18 shadow-[0_14px_34px_rgba(24,74,116,0.14),inset_0_1px_0_rgba(255,255,255,0.48)]",
            className,
          )}
          whileHover={shouldReduce ? {} : { scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          onPointerDown={onPointerDown}
          style={{
            backdropFilter: "blur(18px) saturate(1.7)",
            WebkitBackdropFilter: "blur(18px) saturate(1.7)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Specular sheen — rotates at a different speed than the border */}
          <span
            aria-hidden="true"
            className="tw-glass-sheen pointer-events-none absolute inset-0 rounded-full"
          />
          <span className="glass-orb h-8 w-8 left-1 top-1 opacity-90" />
          <Icon
            size={compact ? 18 : 19}
            strokeWidth={1.9}
            className={prominent ? "text-sky-950" : "text-white"}
          />
          {label ? <span className="relative z-10 pr-1">{label}</span> : null}
          {rippleElements}
          <div
            className="pointer-events-none absolute"
            style={{
              bottom: -8,
              left: compact ? "50%" : 22,
              transform: compact ? "translateX(-50%)" : "none",
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
                background: prominent ? "rgba(3, 105, 161, 0.42)" : "rgba(255,255,255,0.6)",
              }}
            />
            <div
              style={{
                width: 2.5,
                height: 2.5,
                borderRadius: "50%",
                background: prominent ? "rgba(3, 105, 161, 0.28)" : "rgba(255,255,255,0.4)",
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </Link>
  );
}
