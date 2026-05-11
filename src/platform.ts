// ──────────────────────────────────────────────
//  MUNCHROOM – Platforms
// ──────────────────────────────────────────────
import { Rect, WORLD_W, WORLD_H } from './constants';

export interface Platform extends Rect {
  color: string;
  darkColor: string;
}

// Physics: JUMP_VELOCITY=700, GRAVITY=1800 → max jump height ≈ 136 px
// Ground top = WORLD_H-60 = 840.  Player feet at 840 can reach up to y≈704.
//
// ROW 1  (y=715) — reachable from ground (gap ≈ 125 px < 136 px) ✓
// ROW 2  (y=580) — reachable from row 1 (gap ≈ 135 px < 136 px) ✓

/** Ground + 7 floating platforms spread across the world. */
export function buildPlatforms(): Platform[] {
  const groundY = WORLD_H - 60;  // 840
  const row1Y   = 715;           // low tier – reachable from ground
  const row2Y   = 580;           // mid tier – reachable from row 1
  const ph = 28;                 // platform height

  const floating: Omit<Platform, 'color' | 'darkColor'>[] = [
    // ── Row 1 (low) ──────────────────────────────────────────────────────
    { x: 80,   y: row1Y, w: 210, h: ph },  // far left
    { x: 530,  y: row1Y, w: 190, h: ph },  // left-centre
    { x: 1080, y: row1Y, w: 200, h: ph },  // right-centre
    { x: 1680, y: row1Y, w: 190, h: ph },  // right
    { x: 2130, y: row1Y, w: 200, h: ph },  // far right
    // ── Row 2 (mid) ──────────────────────────────────────────────────────
    { x: 310,  y: row2Y, w: 230, h: ph },  // left-mid
    { x: 990,  y: row2Y, w: 220, h: ph },  // centre
    { x: 1680, y: row2Y, w: 220, h: ph },  // right-mid
  ];

  return [
    // Ground
    { x: 0, y: groundY, w: WORLD_W, h: 60, color: '#5D8A3C', darkColor: '#3A5A22' },
    // Floating platforms
    ...floating.map(p => ({ ...p, color: '#C8844A', darkColor: '#8B5E2C' })),
  ];
}
