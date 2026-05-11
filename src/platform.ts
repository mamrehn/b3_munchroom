// ──────────────────────────────────────────────
//  MUNCHROOM – Platforms
// ──────────────────────────────────────────────
import { Rect, WORLD_W, WORLD_H } from './constants';

export interface Platform extends Rect {
  color: string;
  darkColor: string;
}

/** Ground + 3 floating platforms, centred in world. */
export function buildPlatforms(): Platform[] {
  const groundY = WORLD_H - 60;
  return [
    // Ground
    {
      x: 0,
      y: groundY,
      w: WORLD_W,
      h: 60,
      color: '#5D8A3C',
      darkColor: '#3A5A22',
    },
    // Left platform
    {
      x: WORLD_W * 0.12,
      y: WORLD_H * 0.55,
      w: 260,
      h: 28,
      color: '#C8844A',
      darkColor: '#8B5E2C',
    },
    // Centre platform (high)
    {
      x: WORLD_W / 2 - 160,
      y: WORLD_H * 0.34,
      w: 320,
      h: 28,
      color: '#C8844A',
      darkColor: '#8B5E2C',
    },
    // Right platform
    {
      x: WORLD_W * 0.72,
      y: WORLD_H * 0.55,
      w: 260,
      h: 28,
      color: '#C8844A',
      darkColor: '#8B5E2C',
    },
  ];
}
