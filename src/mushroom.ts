// ──────────────────────────────────────────────
//  MUNCHROOM – Mushroom projectile
// ──────────────────────────────────────────────
import {
  MUSHROOM_SPEED, MUSHROOM_GRAVITY,
  MUSHROOM_W, MUSHROOM_H,
  type PlayerIndex,
} from './constants';
import type { Platform } from './platform';

// Bounce restitution on first landing (fraction of impact velocity reflected)
const BOUNCE_RESTITUTION = 0.18;
// Horizontal speed retained after first bounce
const BOUNCE_HX_DAMPEN  = 0.45;
// Rolling friction: speed multiplier per second (exp-decay)
const ROLL_DECAY = 9;  // e^(-9t) → near-zero in ~0.5 s
// Minimum speed before mushroom snaps to rest
const REST_SPEED_THRESHOLD = 6;
// How long (seconds) mushroom sits visible before disappearing
const REST_DURATION = 1.0;

type Phase = 'flying' | 'rolling' | 'resting';

export class Mushroom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: PlayerIndex;
  alive = true;
  age  = 0;
  angle = 0;

  private phase: Phase = 'flying';
  private restTimer = 0;
  private didBounce = false; // true after the first surface contact

  constructor(
    x: number,
    y: number,
    facingRight: boolean,
    owner: PlayerIndex,
    throwerSize: number,
  ) {
    this.x = x;
    this.y = y;
    this.owner = owner;
    // Bigger thrower → faster mushroom
    const speed = MUSHROOM_SPEED * Math.sqrt(throwerSize);
    this.vx = facingRight ? speed : -speed;
    // ~45° launch angle: vy equals horizontal component magnitude
    this.vy = -Math.abs(this.vx);
  }

  update(dt: number, platforms: Platform[]): void {
    if (!this.alive) return;
    this.age += dt;

    // ── Resting phase: frozen, count down, then vanish ──────────────────
    if (this.phase === 'resting') {
      this.restTimer += dt;
      if (this.restTimer >= REST_DURATION) this.alive = false;
      return;
    }

    // ── Rolling phase: friction only, no gravity ─────────────────────────
    if (this.phase === 'rolling') {
      this.vx *= Math.exp(-ROLL_DECAY * dt);
      if (Math.abs(this.vx) < REST_SPEED_THRESHOLD) this.vx = 0;
      this.x += this.vx * dt;
      // Spin proportional to rolling speed
      const spin = Math.min(Math.abs(this.vx) / 60, 5);
      this.angle += (this.vx >= 0 ? spin : -spin) * dt;
      // Lock to the surface it landed on (snap to same Y each frame)
      this.snapToSurface(platforms);
      if (this.vx === 0) {
        this.phase = 'resting';
        this.restTimer = 0;
      }
      return;
    }

    // ── Flying phase: full physics ───────────────────────────────────────
    this.vy += MUSHROOM_GRAVITY * dt;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    // Spin while airborne
    this.angle += (this.vx > 0 ? 5 : -5) * dt;

    // Platform collision (top surface, moving downward)
    const b = this.bounds;
    for (const plat of platforms) {
      if (
        this.vy >= 0 &&
        b.x + b.w > plat.x &&
        b.x < plat.x + plat.w &&
        b.y + b.h > plat.y &&
        b.y + b.h < plat.y + plat.h + 20
      ) {
        this.y = plat.y - MUSHROOM_H / 2;

        if (!this.didBounce && Math.abs(this.vy) > 80) {
          // First landing: one small bounce
          this.vy = -Math.abs(this.vy) * BOUNCE_RESTITUTION;
          this.vx *= BOUNCE_HX_DAMPEN;
          this.didBounce = true;
        } else {
          // Low-energy or second contact → start rolling
          this.vy = 0;
          this.phase = 'rolling';
        }
        break;
      }
    }

    // Fallback: vanish if out of world
    if (this.age > 12 || this.y > 2000) this.alive = false;
  }

  /** Keep the mushroom snapped to whichever platform surface is directly below. */
  private snapToSurface(platforms: Platform[]): void {
    const b = this.bounds;
    for (const plat of platforms) {
      if (b.x + b.w > plat.x && b.x < plat.x + plat.w) {
        if (Math.abs((b.y + b.h) - plat.y) < 10) {
          this.y = plat.y - MUSHROOM_H / 2;
          return;
        }
      }
    }
    // No surface found → fell off edge, resume flying
    this.phase = 'flying';
    this.vy = 0;
  }

  get bounds() {
    return {
      x: this.x - MUSHROOM_W / 2,
      y: this.y - MUSHROOM_H / 2,
      w: MUSHROOM_W,
      h: MUSHROOM_H,
    };
  }
}
