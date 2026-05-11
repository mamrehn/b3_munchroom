// ──────────────────────────────────────────────
//  MUNCHROOM – Renderer (all canvas-drawn sprites)
// ──────────────────────────────────────────────
import { COLORS, WORLD_W, WORLD_H, MUSHROOM_W, MUSHROOM_H } from './constants';
import type { Platform } from './platform';
import type { Player } from './player';
import type { Mushroom } from './mushroom';
import type { Camera } from './camera';

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  clear(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  drawBackground(camera: Camera): void {
    const ctx = this.ctx;
    camera.applyTransform(ctx);

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    grad.addColorStop(0, '#5BA3DC');
    grad.addColorStop(1, '#B8E0FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Decorative clouds
    this.drawClouds(camera);

    // Parallax hills
    this.drawHills();
  }

  private drawClouds(_camera: Camera): void {
    const ctx = this.ctx;
    const clouds: [number, number, number][] = [
      [200, 100, 1.0],
      [600, 70, 1.4],
      [1000, 130, 0.9],
      [1500, 80, 1.2],
      [1900, 110, 1.1],
      [2200, 90, 0.8],
    ];
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const [cx, cy, sc] of clouds) {
      this.puffCloud(cx, cy, sc);
    }
  }

  private puffCloud(cx: number, cy: number, sc: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.arc(50, -10, 30, 0, Math.PI * 2);
    ctx.arc(-50, 5, 28, 0, Math.PI * 2);
    ctx.arc(25, -30, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawHills(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#4A7A32';
    ctx.beginPath();
    ctx.moveTo(0, WORLD_H - 60);
    const pts: [number, number][] = [
      [0, 650], [180, 490], [400, 580], [650, 440],
      [900, 530], [1200, 460], [1500, 550], [1800, 430],
      [2100, 510], [2400, 470], [2400, 650],
    ];
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }

  drawPlatforms(platforms: Platform[]): void {
    const ctx = this.ctx;
    for (const p of platforms) {
      // Platform body
      const r = 8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, [r, r, 0, 0]);
      ctx.fill();
      // Dark stripe at top
      ctx.fillStyle = p.darkColor;
      ctx.fillRect(p.x, p.y, p.w, 8);
      // Brick pattern
      ctx.strokeStyle = p.darkColor;
      ctx.lineWidth = 1.5;
      const bw = 52;
      for (let bx = p.x; bx < p.x + p.w; bx += bw) {
        ctx.strokeRect(bx, p.y + 8, bw, p.h - 8);
      }
    }
  }

  drawPlayer(player: Player, isP1: boolean): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(player.x, player.y);

    const s = player.size;
    const w = player.w;   // = BASE_PLAYER_W * size
    const h = player.h;   // = BASE_PLAYER_H * size

    // Squish / land effect
    let scaleX = 1;
    let scaleY = 1;
    if (player.squishTimer > 0) {
      const t = player.squishTimer / 0.12;
      scaleX = 1 + 0.25 * t;
      scaleY = 1 - 0.2 * t;
    }

    ctx.scale(scaleX * (player.facingRight ? 1 : -1), scaleY);

    const colors = isP1
      ? { body: COLORS.p1Body, cap: COLORS.p1Cap, skin: COLORS.p1Skin, overalls: '#1A3A9C' }
      : { body: COLORS.p2Body, cap: COLORS.p2Cap, skin: COLORS.p2Skin, overalls: '#8B2FC8' };

    // Shadow ellipse
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(0, 4, w * 0.5, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Feet / legs ──
    const legW = w * 0.28;
    const legH = h * 0.24;
    const legY = -legH;
    const legOff = player.runFrame === 1 || player.runFrame === 3 ? 4 * s : 0;
    // Left leg
    ctx.fillStyle = colors.overalls;
    ctx.fillRect(-w * 0.36, legY + (player.runFrame < 2 ? -legOff : legOff), legW, legH);
    // Right leg
    ctx.fillRect(w * 0.08, legY + (player.runFrame >= 2 ? -legOff : legOff), legW, legH);
    // Shoes
    ctx.fillStyle = '#2C1810';
    ctx.beginPath();
    ctx.roundRect(-w * 0.42, -6 * s, legW + 8 * s, 12 * s, 4 * s);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(w * 0.04, -6 * s, legW + 8 * s, 12 * s, 4 * s);
    ctx.fill();

    // ── Body / overalls ──
    const bodyW = w * 0.78;
    const bodyH = h * 0.40;
    const bodyY = -(legH + bodyH);
    ctx.fillStyle = colors.overalls;
    ctx.beginPath();
    ctx.roundRect(-bodyW / 2, bodyY, bodyW, bodyH, [8 * s, 8 * s, 0, 0]);
    ctx.fill();
    // Shirt colour on torso sides
    ctx.fillStyle = colors.body;
    ctx.fillRect(-bodyW / 2, bodyY + bodyH * 0.3, bodyW * 0.22, bodyH * 0.7);
    ctx.fillRect(bodyW / 2 - bodyW * 0.22, bodyY + bodyH * 0.3, bodyW * 0.22, bodyH * 0.7);
    // Overall buttons
    ctx.fillStyle = '#FFD700';
    const btnY = bodyY + bodyH * 0.22;
    ctx.beginPath();
    ctx.arc(-4 * s, btnY, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4 * s, btnY, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // ── Head ──
    const headR = w * 0.46;
    const headY = bodyY - headR * 0.7;
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    // ── Chew / jaw animation ──
    const jawDrop = player.jawOpen * headR * 0.38;
    // Mouth
    ctx.fillStyle = '#5C2200';
    ctx.beginPath();
    ctx.ellipse(headR * 0.2, headY + headR * 0.3, headR * 0.22, headR * 0.14 + jawDrop, 0, 0, Math.PI * 2);
    ctx.fill();
    if (player.jawOpen > 0.3) {
      // Teeth
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(headR * 0.08, headY + headR * 0.26, headR * 0.14, headR * 0.1);
      ctx.fillRect(headR * 0.22, headY + headR * 0.26, headR * 0.14, headR * 0.1);
    }

    // Eyes
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(headR * 0.28, headY - headR * 0.08, 4.5 * s, 0, Math.PI * 2);
    ctx.fill();
    // Eye white highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(headR * 0.32, headY - headR * 0.11, 1.8 * s, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#E07050';
    ctx.beginPath();
    ctx.ellipse(headR * 0.22, headY + headR * 0.06, 4 * s, 3 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Moustache
    ctx.fillStyle = '#3C1A00';
    ctx.beginPath();
    ctx.ellipse(headR * 0.05, headY + headR * 0.18, 6 * s, 3.5 * s, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headR * 0.35, headY + headR * 0.18, 6 * s, 3.5 * s, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // ── Cap ──
    ctx.fillStyle = colors.cap;
    ctx.beginPath();
    // Brim
    ctx.ellipse(0, headY - headR * 0.55, headR * 1.1, headR * 0.22, 0, Math.PI, 0);
    ctx.fill();
    // Cap dome
    ctx.beginPath();
    ctx.arc(0, headY - headR * 0.55, headR * 0.9, Math.PI, 0);
    ctx.fill();
    // Cap letter
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(14 * s)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isP1 ? 'M' : 'L', 0, headY - headR * 0.75);

    // ── Arm / throw pose ──
    const armY = bodyY + bodyH * 0.2;
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.roundRect(bodyW * 0.38, armY, 12 * s, 28 * s, 5 * s);
    ctx.fill();

    ctx.restore();
  }

  drawMushroom(m: Mushroom): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle);

    const w = MUSHROOM_W;
    const h = MUSHROOM_H;

    // Stem
    ctx.fillStyle = '#F5E6C8';
    ctx.beginPath();
    ctx.roundRect(-w * 0.22, 0, w * 0.44, h * 0.5, 3);
    ctx.fill();

    // Cap
    ctx.fillStyle = COLORS.mushroomCap;
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.55, Math.PI, 0);
    ctx.fill();

    // Spots
    ctx.fillStyle = COLORS.mushroomSpot;
    ctx.beginPath();
    ctx.arc(-5, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, -10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Face on mushroom
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-4, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -1, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore();
  }

  /** Draw hit flash ring around player */
  drawHitFlash(player: Player): void {
    if (player.chewTimer <= 0) return;
    const ctx = this.ctx;
    const t = player.chewTimer / 0.55;
    ctx.save();
    ctx.translate(player.x, player.y - player.h / 2);
    ctx.strokeStyle = `rgba(255, 230, 0, ${t * 0.9})`;
    ctx.lineWidth = 4 * player.size * t;
    ctx.beginPath();
    ctx.arc(0, 0, player.w * 0.65 + (1 - t) * 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
