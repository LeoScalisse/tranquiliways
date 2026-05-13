import { motion, useReducedMotion } from "motion/react";
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
  icon: Icon,
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
  const hasLabel = Boolean(label);
  const iconSize = hasLabel ? 30 : compact ? 18 : 19;
  const iconTone = prominent ? "text-sky-950" : hasLabel ? "text-white/75" : "text-white";

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
            "relative inline-flex items-center justify-center overflow-hidden rounded-full text-white",
            hasLabel
              ? "tw-liquid-ways h-12 min-w-[7rem] gap-1.5 px-3.5 text-[1.2rem] font-black"
              : cn(
                  "gap-2 text-sm font-medium",
                  compact ? "h-11 min-w-11 px-3" : "h-12 min-w-12 px-4",
                ),
            prominent
              ? "bg-white/26 text-sky-950 shadow-[0_18px_44px_rgba(24,74,116,0.18),inset_0_1px_0_rgba(255,255,255,0.6)]"
              : "bg-white/18 shadow-[0_14px_34px_rgba(24,74,116,0.14),inset_0_1px_0_rgba(255,255,255,0.48)]",
            className,
          )}
          whileHover={shouldReduce ? {} : { scale: hasLabel ? 1.02 : 1.05 }}
          whileTap={shouldReduce ? {} : { scale: 0.95 }}
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
          <span className="tw-ways-icon-wrap relative z-10 flex shrink-0 items-center justify-center">
            {Icon ? (
              <Icon
                size={iconSize}
                strokeWidth={1.9}
                className={cn(hasLabel && "tw-ways-icon", iconTone)}
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={iconSize}
                height={iconSize}
                aria-hidden="true"
                className={cn("tw-ways-icon block fill-current", iconTone)}
              >
                <path d="M22,15.04C22,17.23 20.24,19 18.07,19H5.93C3.76,19 2,17.23 2,15.04C2,13.07 3.43,11.44 5.31,11.14C5.28,11 5.27,10.86 5.27,10.71C5.27,9.33 6.38,8.2 7.76,8.2C8.37,8.2 8.94,8.43 9.37,8.8C10.14,7.05 11.13,5.44 13.91,5.44C17.28,5.44 18.87,8.06 18.87,10.83C18.87,10.94 18.87,11.06 18.86,11.17C20.65,11.54 22,13.13 22,15.04Z" />
              </svg>
            )}
          </span>
          {label ? <span className="tw-ways-label relative z-10 pr-1">{label}</span> : null}
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
