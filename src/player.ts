// ──────────────────────────────────────────────
//  MUNCHROOM – Player
// ──────────────────────────────────────────────
import {
  GRAVITY, JUMP_VELOCITY, PLAYER_SPEED,
  BASE_SIZE, SIZE_PER_HIT, MAX_SIZE,
  BASE_THROW_COOLDOWN,
  BASE_PLAYER_W, BASE_PLAYER_H,
  CHEW_DURATION,
  WORLD_W, WORLD_H,
  type PlayerIndex, type Rect,
} from './constants';
import { Platform } from './platform';
import { Mushroom } from './mushroom';
import { AudioEngine } from './audio';

// ── Input state for one player ──
export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  throw: boolean;
}

export class Player {
  // World position (centre bottom)
  x: number;
  y: number;
  vx = 0;
  vy = 0;

  size: BASE_SIZE_TYPE = BASE_SIZE;
  onGround = false;
  facingRight: boolean;

  // Throw cooldown
  throwTimer = 0;

  // Chew / hit animation
  chewTimer = 0;   // counts down from CHEW_DURATION
  jawOpen = 0;     // 0..1

  // Run animation
  runTimer = 0;
  runFrame = 0;    // 0..3

  // Jump visual
  squishTimer = 0; // brief squish on land

  // Hit history for rolling window
  hitTimestamps: number[] = [];

  readonly index: PlayerIndex;

  constructor(index: PlayerIndex, startX: number, startY: number) {
    this.index = index;
    this.x = startX;
    this.y = startY;
    this.facingRight = index === 0;
    this.size = BASE_SIZE;
  }

  get w(): number {
    return BASE_PLAYER_W * this.size;
  }
  get h(): number {
    return BASE_PLAYER_H * this.size;
  }

  /** AABB for collision with world / mushrooms */
  get bounds(): Rect {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h,
      w: this.w,
      h: this.h,
    };
  }

  /** Throw cooldown adjusted for size: bigger = faster */
  get throwCooldown(): number {
    return BASE_THROW_COOLDOWN / this.size;
  }

  update(
    dt: number,
    input: PlayerInput,
    platforms: Platform[],
    audio: AudioEngine,
  ): Mushroom | null {
    // ── Timers ──
    if (this.throwTimer > 0) this.throwTimer -= dt;
    if (this.chewTimer > 0) {
      this.chewTimer -= dt;
      const t = 1 - this.chewTimer / CHEW_DURATION;
      // jaw oscillates open/close several times
      this.jawOpen = Math.abs(Math.sin(t * Math.PI * CHEW_FRAMES_PER_ANIM));
    } else {
      this.jawOpen = 0;
    }
    if (this.squishTimer > 0) this.squishTimer -= dt;

    // ── Horizontal movement ──
    let moved = false;
    if (input.left) {
      this.vx = -PLAYER_SPEED * this.size;
      this.facingRight = false;
      moved = true;
    } else if (input.right) {
      this.vx = PLAYER_SPEED * this.size;
      this.facingRight = true;
      moved = true;
    } else {
      // Friction
      this.vx *= 0.78;
      if (Math.abs(this.vx) < 2) this.vx = 0;
    }

    // ── Jump ──
    if (input.jump && this.onGround) {
      this.vy = JUMP_VELOCITY * Math.sqrt(this.size); // bigger = slightly higher jump
      this.onGround = false;
      audio.playJump();
    }

    // ── Gravity ──
    this.vy += GRAVITY * dt;

    // ── Integrate position ──
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // ── Clamp x to world ──
    const hw = this.w / 2;
    if (this.x - hw < 0) { this.x = hw; this.vx = 0; }
    if (this.x + hw > WORLD_W) { this.x = WORLD_W - hw; this.vx = 0; }

    // ── Platform collision ──
    const wasOnGround = this.onGround;
    this.onGround = false;
    for (const plat of platforms) {
      this.resolveVsPlatform(plat);
    }
    if (!wasOnGround && this.onGround) {
      this.squishTimer = 0.12;
      audio.playLand();
    }

    // ── Run animation ──
    if (moved && this.onGround) {
      this.runTimer += dt;
      if (this.runTimer > 0.1) {
        this.runTimer = 0;
        this.runFrame = (this.runFrame + 1) % 4;
      }
    } else {
      this.runFrame = 0;
      this.runTimer = 0;
    }

    // ── Throw ──
    if (input.throw && this.throwTimer <= 0) {
      this.throwTimer = this.throwCooldown;
      audio.playThrow();
      return new Mushroom(
        this.x + (this.facingRight ? this.w * 0.6 : -this.w * 0.6),
        this.y - this.h * 0.5,
        this.facingRight,
        this.index,
        this.size,
      );
    }

    return null;
  }

  private resolveVsPlatform(plat: Platform): void {
    const pb = this.bounds;
    // Only collide top surface (falling down onto platform)
    if (
      pb.x + pb.w > plat.x &&
      pb.x < plat.x + plat.w &&
      this.vy >= 0 &&
      pb.y + pb.h > plat.y &&
      pb.y + pb.h < plat.y + plat.h + 24 // only top-surface
    ) {
      this.y = plat.y;
      this.vy = 0;
      this.onGround = true;
    }
  }

  /** Called when this player is hit by a mushroom */
  onHit(gameTime: number, audio: AudioEngine): void {
    this.size = Math.min(MAX_SIZE, this.size + SIZE_PER_HIT);
    this.chewTimer = CHEW_DURATION;
    this.hitTimestamps.push(gameTime);
    audio.playMunch();
    setTimeout(() => audio.playGrow(), 350);
  }

  /** Count hits in the last 30 seconds */
  recentHitCount(gameTime: number): number {
    const cutoff = gameTime - 30;
    this.hitTimestamps = this.hitTimestamps.filter(t => t >= cutoff);
    return this.hitTimestamps.length;
  }

  reset(startX: number, startY: number): void {
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.size = BASE_SIZE;
    this.onGround = false;
    this.throwTimer = 0;
    this.chewTimer = 0;
    this.jawOpen = 0;
    this.runFrame = 0;
    this.runTimer = 0;
    this.squishTimer = 0;
    this.hitTimestamps = [];
    this.facingRight = this.index === 0;
  }
}

// Module-level constant used in Player (must be after class due to TS hoisting)
const CHEW_FRAMES_PER_ANIM = 6;
// Alias type so TS is happy
type BASE_SIZE_TYPE = number;
