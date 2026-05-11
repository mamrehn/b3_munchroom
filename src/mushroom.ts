// ──────────────────────────────────────────────
//  MUNCHROOM – Mushroom projectile
// ──────────────────────────────────────────────
import {
  MUSHROOM_SPEED, MUSHROOM_GRAVITY,
  MUSHROOM_W, MUSHROOM_H,
  type PlayerIndex,
} from './constants';
import type { Platform } from './platform';

export class Mushroom {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: PlayerIndex;
  alive = true;
  age = 0; // seconds since thrown
  // Spin angle for visual flair
  angle = 0;

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
    // Bigger thrower → faster mushroom (sqrt scaling keeps it sane)
    const speed = MUSHROOM_SPEED * Math.sqrt(throwerSize);
    this.vx = facingRight ? speed : -speed;
    this.vy = -speed * 0.28; // proportional upward arc → true parabola shape
  }

  update(dt: number, platforms: Platform[]): void {
    if (!this.alive) return;
    this.vy += MUSHROOM_GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.vx > 0 ? 4 * dt : -4 * dt; // spin
    this.age += dt;

    // Collide with floating platforms (top surface only, moving downward)
    const b = this.bounds;
    for (const plat of platforms) {
      if (
        this.vy >= 0 &&
        b.x + b.w > plat.x &&
        b.x < plat.x + plat.w &&
        b.y + b.h > plat.y &&
        b.y + b.h < plat.y + plat.h + 20
      ) {
        this.y = plat.y - b.h / 2; // sit on platform top
        this.vy = 0;
      }
    }

    // Die after 5 seconds or out of reasonable vertical bounds
    if (this.age > 5 || this.y > 2000) {
      this.alive = false;
    }
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
