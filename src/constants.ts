// ──────────────────────────────────────────────
//  MUNCHROOM – constants & shared types
// ──────────────────────────────────────────────

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// World dimensions (pixels in world-space)
export const WORLD_W = 2400;
export const WORLD_H = 900;

// Physics
export const GRAVITY = 1800;           // px/s²
export const JUMP_VELOCITY = -700;     // px/s
export const PLAYER_SPEED = 320;       // px/s horizontal

// Player
export const BASE_SIZE = 1.0;
export const SIZE_PER_HIT = 0.18;
export const MAX_SIZE = 50;
export const BASE_THROW_COOLDOWN = 4.0; // seconds at size 1
export const BASE_PLAYER_W = 52;
export const BASE_PLAYER_H = 64;

// Mushroom projectile
export const MUSHROOM_SPEED = 480;     // px/s
export const MUSHROOM_GRAVITY = 600;   // px/s² (lighter arc)
export const MUSHROOM_W = 30;
export const MUSHROOM_H = 30;

// Camera
export const CAMERA_ZOOM_SPEED = 0.0015; // zoom-out units per second (slow)
export const CAMERA_MIN_ZOOM = 0.48;     // stop when full world width ~fits

// Round
export const NO_HIT_TIMEOUT = 30;     // seconds
export const HIT_COUNT_WINDOW = 30;   // seconds
export const HIT_COUNT_LIMIT = 30;    // hits within window → loss

// Chew animation
export const CHEW_DURATION = 0.55;    // seconds
export const CHEW_FRAMES = 8;

// Colours
export const COLORS = {
  sky: '#87CEEB',
  ground: '#5D8A3C',
  groundDark: '#3A5A22',
  platform: '#C8844A',
  platformDark: '#8B5E2C',
  p1Body: '#E8283C',        // Mario red
  p1Cap: '#C81E28',
  p1Skin: '#FFCBA4',
  p2Body: '#2860C8',        // Luigi blue
  p2Cap: '#1A44A0',
  p2Skin: '#FFCBA4',
  mushroom: '#FF6B6B',
  mushroomCap: '#CC3333',
  mushroomSpot: '#FFFFFF',
  shadow: 'rgba(0,0,0,0.25)',
  hudBg: 'rgba(0,0,0,0.55)',
};

// ──── Types ────

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export type PlayerIndex = 0 | 1;
