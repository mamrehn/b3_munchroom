// ──────────────────────────────────────────────
//  MUNCHROOM – Game (round/session orchestrator + main loop)
// ──────────────────────────────────────────────
import {
  CANVAS_W, CANVAS_H,
  NO_HIT_TIMEOUT, HIT_COUNT_LIMIT,
  WORLD_H,
} from './constants';
import { buildPlatforms, Platform } from './platform';
import { Player, PlayerInput } from './player';
import { Mushroom } from './mushroom';
import { Camera } from './camera';
import { Renderer } from './renderer';
import { UI } from './ui';
import { AudioEngine } from './audio';

// ──────────────────────────
//  Input handler
// ──────────────────────────
class InputManager {
  private keys = new Set<string>();

  constructor() {
    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      // Prevent page scrolling on arrow keys / space
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
  }

  get p1(): PlayerInput {
    return {
      left: this.keys.has('KeyA'),
      right: this.keys.has('KeyD'),
      jump: this.keys.has('KeyW') || this.keys.has('Space'),
      throw: this.keys.has('KeyQ'),
    };
  }

  get p2(): PlayerInput {
    return {
      left: this.keys.has('ArrowLeft'),
      right: this.keys.has('ArrowRight'),
      jump: this.keys.has('ArrowUp'),
      throw: this.keys.has('ControlRight') || this.keys.has('ControlLeft'),
    };
  }

  isSpaceDown(): boolean {
    return this.keys.has('Space');
  }
}

// ──────────────────────────
//  Round outcome
// ──────────────────────────
type RoundOutcome =
  | { winner: 0 | 1; reason: string }
  | { winner: -1; reason: string }; // draw (shouldn't happen with current rules)

// ──────────────────────────
//  Game states
// ──────────────────────────
type GameState =
  | 'countdown'
  | 'playing'
  | 'round_end'
  | 'match_end';

// ──────────────────────────
//  Spawn positions
// ──────────────────────────
const SPAWN_POSITIONS: [number, number][] = [
  [CANVAS_W * 0.28, WORLD_H - 62],  // P1 – left
  [CANVAS_W * 1.3, WORLD_H - 62],   // P2 – right (world-space)
];

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private platforms: Platform[];
  private players: [Player, Player];
  private mushrooms: Mushroom[] = [];

  private camera: Camera;
  private renderer: Renderer;
  private ui: UI;
  private audio: AudioEngine;
  private input: InputManager;

  // Session
  private scores: [number, number] = [0, 0];
  private currentRound = 1;
  private readonly MAX_ROUNDS = 3;

  // Round timing
  private gameTime = 0;        // total time in current round
  private noHitTimer = NO_HIT_TIMEOUT;
  private state: GameState = 'countdown';
  private countdownValue = 3;
  private countdownTimer = 0;

  // Round-end display
  private roundEndTimer = 0;
  private lastOutcome: RoundOutcome | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D context');
    this.ctx = ctx;

    this.platforms = buildPlatforms();
    this.players = [
      new Player(0, SPAWN_POSITIONS[0][0], SPAWN_POSITIONS[0][1]),
      new Player(1, SPAWN_POSITIONS[1][0], SPAWN_POSITIONS[1][1]),
    ];
    this.camera = new Camera();
    this.renderer = new Renderer(this.ctx);
    this.ui = new UI(this.ctx);
    this.audio = new AudioEngine();
    this.input = new InputManager();

    this.startCountdown();
  }

  // ─────────────────────────────────────────────
  //  Public entry – start the game loop
  // ─────────────────────────────────────────────
  start(): void {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // cap at 50ms
      last = now;
      this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────
  //  Update
  // ─────────────────────────────────────────────
  private update(dt: number): void {
    switch (this.state) {
      case 'countdown': this.updateCountdown(dt); break;
      case 'playing':   this.updatePlaying(dt);   break;
      case 'round_end': this.updateRoundEnd(dt);  break;
      case 'match_end': this.updateMatchEnd();    break;
    }
  }

  private updateCountdown(dt: number): void {
    this.countdownTimer -= dt;
    if (this.countdownTimer <= 0) {
      this.countdownValue--;
      if (this.countdownValue < 0) {
        this.state = 'playing';
      } else {
        this.countdownTimer = 1.0;
      }
    }
  }

  private updatePlaying(dt: number): void {
    this.gameTime += dt;

    // Update players
    const [p1, p2] = this.players;
    const m1 = p1.update(dt, this.input.p1, this.platforms, this.audio);
    const m2 = p2.update(dt, this.input.p2, this.platforms, this.audio);
    if (m1) this.mushrooms.push(m1);
    if (m2) this.mushrooms.push(m2);

    // Update mushrooms
    for (const m of this.mushrooms) {
      m.update(dt, this.platforms);
    }

    // Hit detection
    let hitHappened = false;
    for (const m of this.mushrooms) {
      if (!m.alive) continue;
      for (const player of this.players) {
        if (player.index === m.owner) continue; // own mushroom
        if (this.rectsOverlap(m.bounds, player.bounds)) {
          m.alive = false;
          player.onHit(this.gameTime, this.audio);
          hitHappened = true;
        }
      }
    }

    // Prune dead mushrooms
    this.mushrooms = this.mushrooms.filter(m => m.alive);

    // No-hit timer
    if (hitHappened) {
      this.noHitTimer = NO_HIT_TIMEOUT;
    } else {
      this.noHitTimer -= dt;
    }

    // Camera
    this.camera.update(dt, { x: p1.x, y: p1.y }, { x: p2.x, y: p2.y });

    // Clamp players to camera viewport
    const vw = CANVAS_W / this.camera.zoom;
    const vh = CANVAS_H / this.camera.zoom;
    const cvx = this.camera.x;
    const cvy = this.camera.y;
    for (const p of this.players) {
      const hw = p.w / 2;
      if (p.x - hw < cvx)        { p.x = cvx + hw;         p.vx = 0; }
      if (p.x + hw > cvx + vw)   { p.x = cvx + vw - hw;    p.vx = 0; }
      if (p.y - p.h < cvy)       { p.y = cvy + p.h;        p.vy = 0; }
      if (p.y > cvy + vh)        { p.y = cvy + vh;          p.vy = 0; }
    }

    // ── Check win conditions ──
    const outcome = this.checkWinConditions();
    if (outcome) {
      this.endRound(outcome);
    }
  }

  private updateRoundEnd(dt: number): void {
    this.roundEndTimer -= dt;
    if (this.roundEndTimer <= 0) {
      if (this.scores[0] >= 2 || this.scores[1] >= 2) {
        this.state = 'match_end';
        this.audio.playWin();
      } else {
        this.currentRound++;
        this.startNewRound();
      }
    }
  }

  private updateMatchEnd(): void {
    if (this.input.isSpaceDown()) {
      // Reset everything
      this.scores = [0, 0];
      this.currentRound = 1;
      this.startNewRound();
    }
  }

  // ─────────────────────────────────────────────
  //  Win condition checks
  // ─────────────────────────────────────────────
  private checkWinConditions(): RoundOutcome | null {
    const [p1, p2] = this.players;

    // 30 hits in 30-second window
    const p1Hits = p1.recentHitCount(this.gameTime);
    const p2Hits = p2.recentHitCount(this.gameTime);

    if (p1Hits >= HIT_COUNT_LIMIT) {
      return { winner: 1, reason: 'P1 hit 30 times! Too big to dodge!' };
    }
    if (p2Hits >= HIT_COUNT_LIMIT) {
      return { winner: 0, reason: 'P2 hit 30 times! Too big to dodge!' };
    }

    // No-hit timeout: smaller player wins
    if (this.noHitTimer <= 0) {
      if (p1.size < p2.size) {
        return { winner: 0, reason: 'P1 stayed lean – wins on timeout!' };
      } else if (p2.size < p1.size) {
        return { winner: 1, reason: 'P2 stayed lean – wins on timeout!' };
      } else {
        // Equal size – very rare, call it P1 advantage
        return { winner: 0, reason: 'Equal size – P1 wins on tiebreak!' };
      }
    }

    return null;
  }

  // ─────────────────────────────────────────────
  //  Round/Match management
  // ─────────────────────────────────────────────
  private endRound(outcome: RoundOutcome): void {
    this.lastOutcome = outcome;
    if (outcome.winner === 0 || outcome.winner === 1) {
      this.scores[outcome.winner]++;
    }
    this.audio.playRoundEnd();
    this.state = 'round_end';
    this.roundEndTimer = 3.5;
  }

  private startNewRound(): void {
    this.mushrooms = [];
    this.players[0].reset(SPAWN_POSITIONS[0][0], SPAWN_POSITIONS[0][1]);
    this.players[1].reset(SPAWN_POSITIONS[1][0], SPAWN_POSITIONS[1][1]);
    this.gameTime = 0;
    this.noHitTimer = NO_HIT_TIMEOUT;
    this.camera = new Camera();
    this.startCountdown();
  }

  private startCountdown(): void {
    this.state = 'countdown';
    this.countdownValue = 3;
    this.countdownTimer = 1.0;
  }

  // ─────────────────────────────────────────────
  //  Draw
  // ─────────────────────────────────────────────
  private draw(): void {
    this.renderer.clear();

    if (this.state === 'match_end' && this.lastOutcome) {
      // Full scoreboard
      this.renderer.drawBackground(this.camera);
      this.camera.applyTransform(this.ctx);
      this.renderer.drawPlatforms(this.platforms);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ui.drawScoreboard(this.scores);
      const winner = this.scores[0] >= 2 ? 'PLAYER 1' : 'PLAYER 2';
      this.ui.drawMatchWinner(winner);
      return;
    }

    // World
    this.renderer.drawBackground(this.camera);
    this.camera.applyTransform(this.ctx);
    this.renderer.drawPlatforms(this.platforms);

    // Mushrooms
    for (const m of this.mushrooms) {
      this.renderer.drawMushroom(m);
    }

    // Players
    this.renderer.drawPlayer(this.players[0], true);
    this.renderer.drawPlayer(this.players[1], false);
    this.renderer.drawHitFlash(this.players[0]);
    this.renderer.drawHitFlash(this.players[1]);

    // HUD (canvas-space)
    this.ui.drawHUD(this.players[0], this.players[1], this.noHitTimer, this.scores);

    if (this.state === 'countdown') {
      this.ui.drawCountdown(this.countdownValue);
    }

    if (this.state === 'round_end' && this.lastOutcome) {
      const o = this.lastOutcome;
      const name = o.winner === 0 ? 'PLAYER 1' : o.winner === 1 ? 'PLAYER 2' : 'NOBODY';
      this.ui.drawRoundEnd(`ROUND → ${name}`, o.reason);
      this.ui.drawScoreboard(this.scores);
    }
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────
  private rectsOverlap(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }
}
