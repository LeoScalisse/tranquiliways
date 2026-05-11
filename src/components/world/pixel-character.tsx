import { motion } from "motion/react";
import type { CharacterConfig } from "@/hooks/use-world-state-machine";
import { getSkinColor } from "@/hooks/use-world-state-machine";

interface PixelCharacterProps {
  config: CharacterConfig;
  size?: number;
}

export function PixelCharacter({ config, size = 48 }: PixelCharacterProps) {
  const skin = getSkinColor(config.skinTone);
  const outfit = config.outfitColor;
  const outfitDark = shadeColor(outfit, -30);
  const scale = size / 48;

  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: size, height: size * 1.5, position: "relative", imageRendering: "pixelated" }}
    >
      {/* Head */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 8 * scale,
          width: 16 * scale,
          height: 16 * scale,
          background: skin,
          borderRadius: 2,
        }}
      />
      {/* Left eye */}
      <div
        style={{
          position: "absolute",
          top: 5 * scale,
          left: 11 * scale,
          width: 3 * scale,
          height: 3 * scale,
          background: "#1a1a1a",
        }}
      />
      {/* Right eye */}
      <div
        style={{
          position: "absolute",
          top: 5 * scale,
          left: 18 * scale,
          width: 3 * scale,
          height: 3 * scale,
          background: "#1a1a1a",
        }}
      />
      {/* Body */}
      <div
        style={{
          position: "absolute",
          top: 16 * scale,
          left: 6 * scale,
          width: 20 * scale,
          height: 18 * scale,
          background: outfit,
          borderRadius: 1,
        }}
      />
      {/* Left arm */}
      <div
        style={{
          position: "absolute",
          top: 17 * scale,
          left: 0,
          width: 6 * scale,
          height: 14 * scale,
          background: outfit,
          borderRadius: 1,
        }}
      />
      {/* Right arm */}
      <div
        style={{
          position: "absolute",
          top: 17 * scale,
          right: 0,
          width: 6 * scale,
          height: 14 * scale,
          background: outfit,
          borderRadius: 1,
        }}
      />
      {/* Left leg */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 6 * scale,
          width: 8 * scale,
          height: 14 * scale,
          background: outfitDark,
          borderRadius: 1,
        }}
      />
      {/* Right leg */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 6 * scale,
          width: 8 * scale,
          height: 14 * scale,
          background: outfitDark,
          borderRadius: 1,
        }}
      />
    </motion.div>
  );
}

function shadeColor(hex: string, percent: number): string {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (n & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
