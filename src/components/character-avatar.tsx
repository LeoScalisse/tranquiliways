import type { CharacterCustomization } from "@/hooks/use-character-customization.ts";

interface Props {
  customization: CharacterCustomization;
  size?: number;
  activeAttribute?: keyof CharacterCustomization | null;
}

function highlight(attr: keyof CharacterCustomization | null | undefined, ...keys: string[]) {
  return attr && keys.includes(attr) ? "#3b82f6" : "none";
}

export function CharacterAvatar({ customization, size = 200, activeAttribute = null }: Props) {
  return (
    <svg
      width={size}
      height={size * 1.6}
      viewBox="0 0 100 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hair back */}
      <ellipse cx="50" cy="28" rx="21" ry="17" fill={customization.hairColor}
        stroke={highlight(activeAttribute, "hairStyle", "hairColor")} strokeWidth="2" />
      {/* Head */}
      <ellipse cx="50" cy="37" rx="17" ry="19" fill={customization.skinColor} />
      {/* Eyes */}
      <ellipse cx="44" cy="34" rx="2.5" ry="2.5" fill={customization.eyeColor}
        stroke={highlight(activeAttribute, "eyeColor")} strokeWidth="1.5" />
      <ellipse cx="56" cy="34" rx="2.5" ry="2.5" fill={customization.eyeColor}
        stroke={highlight(activeAttribute, "eyeColor")} strokeWidth="1.5" />
      {/* Neck */}
      <rect x="45" y="53" width="10" height="7" fill={customization.skinColor} />
      {/* Shirt / torso */}
      <rect x="32" y="58" width="36" height="34" rx="7" fill={customization.shirtColor}
        stroke={highlight(activeAttribute, "shirt", "shirtColor")} strokeWidth="2" />
      {/* Arms */}
      <rect x="18" y="60" width="14" height="28" rx="6" fill={customization.shirtColor}
        stroke={highlight(activeAttribute, "shirt", "shirtColor")} strokeWidth="1.5" />
      <rect x="68" y="60" width="14" height="28" rx="6" fill={customization.shirtColor}
        stroke={highlight(activeAttribute, "shirt", "shirtColor")} strokeWidth="1.5" />
      {/* Hands */}
      <ellipse cx="25" cy="91" rx="5" ry="5" fill={customization.skinColor} />
      <ellipse cx="75" cy="91" rx="5" ry="5" fill={customization.skinColor} />
      {/* Pants left */}
      <rect x="32" y="90" width="16" height="42" rx="5" fill={customization.pantsColor}
        stroke={highlight(activeAttribute, "pants", "pantsColor")} strokeWidth="2" />
      {/* Pants right */}
      <rect x="52" y="90" width="16" height="42" rx="5" fill={customization.pantsColor}
        stroke={highlight(activeAttribute, "pants", "pantsColor")} strokeWidth="2" />
      {/* Shoes */}
      <ellipse cx="40" cy="134" rx="11" ry="6" fill={customization.shoeColor}
        stroke={highlight(activeAttribute, "shoes", "shoeColor")} strokeWidth="2" />
      <ellipse cx="60" cy="134" rx="11" ry="6" fill={customization.shoeColor}
        stroke={highlight(activeAttribute, "shoes", "shoeColor")} strokeWidth="2" />
    </svg>
  );
}
