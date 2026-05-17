export const CAMERA = {
  FRUSTUM_SIZE: 10,
  NEAR: 0.1,
  FAR: 100,
  POSITION: [15, 15, 15] as const,
} as const;

export const CHARACTER = {
  MOVE_SPEED: 4,
  SCALE: 0.8,
  ROTATION_OFFSET: Math.PI,
  MODEL_PATH: "assets/models/character.glb",
  WALK_ANIM_PATH: "assets/models/character-walk.glb",
} as const;

export const PORTAL = {
  PARADO_POSITION: [-2.5, 0, 0] as const,
  MUDANCA_POSITION: [2.5, 0, 0] as const,
  TRIGGER_RADIUS: 1.5,
  GLOW_PARADO: "#3b82f6",
  GLOW_MUDANCA: "#f59e0b",
} as const;

export const DPAD = {
  HIDE_DELAY_MS: 5000,
  OPACITY_ACTIVE: 0.4,
  SIZE_PX: 130,
} as const;

export const TRANSITION = {
  DURATION: 0.4,
  EASE: [0.16, 1, 0.3, 1] as const,
} as const;

export const WORLD_LABS = {
  DESKTOP_TIER: "500k",
  MOBILE_TIER: "100k",
  WORLDS_BASE: "assets/worlds/",
} as const;
