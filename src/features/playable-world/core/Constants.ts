const CAMERA_POSITION = [15, 15, 15] as const;
const CAMERA_DISTANCE = Math.hypot(...CAMERA_POSITION);

export const CAMERA = {
  FRUSTUM_SIZE: 10,
  NEAR: 0.1,
  FAR: 100,
  POSITION: CAMERA_POSITION,
} as const;

// Fog distances derived from camera distance (≈26) so the scene never falls
// inside the fog "wall". With NEAR=1.2× and FAR=3.0× the scene content
// (~15–41 units from camera) is crisp, with a gentle haze on the far ground.
export const FOG = {
  NEAR: CAMERA_DISTANCE * 1.2,
  FAR: CAMERA_DISTANCE * 3.0,
} as const;

export const CHARACTER = {
  MOVE_SPEED: 4,
  SCALE: 2.0,
  ROTATION_OFFSET: Math.PI,
  MODEL_PATH: "/assets/models/character.glb",
  WALK_ANIM_PATH: "/assets/models/character-walk.glb",
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

