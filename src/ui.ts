// ──────────────────────────────────────────────
//  MUNCHROOM – HUD & UI overlay (drawn on canvas)
// ──────────────────────────────────────────────
import { CANVAS_W, CANVAS_H, NO_HIT_TIMEOUT } from './constants';
import type { Player } from './player';

export class UI {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawHUD(
    p1: Player,
    p2: Player,
    noHitTimer: number,
    scores: [number, number],
  ): void {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // ── Player 1 panel (top-left) ──
    this.drawPlayerPanel(p1, 20, 16, true, scores[0]);

    // ── Player 2 panel (top-right) ──
    this.drawPlayerPanel(p2, CANVAS_W - 260, 16, false, scores[1]);

    // ── Centre timer ──
    this.drawTimer(noHitTimer);
  }

  private drawPlayerPanel(
    player: Player,
    x: number,
    y: number,
    isP1: boolean,
    score: number,
  ): void {
    const ctx = this.ctx;
    const panelW = 240;
    const panelH = 80;

    // Panel background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, panelW, panelH, 10);
    ctx.fill();

    // Border colour
    ctx.strokeStyle = isP1 ? '#E8283C' : '#2860C8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, panelW, panelH, 10);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(isP1 ? 'P1 (WASD + Q)' : 'P2 (ARROWS + CTRL)', x + 10, y + 8);

    // Size bar
    const barX = x + 10;
    const barY = y + 30;
    const barW = panelW - 20;
    const barH = 16;
    const fillRatio = (player.size - 1) / 3.5; // 0..1 from 1.0 to 4.5
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();
    const fillColor = fillRatio < 0.5
      ? `hsl(${120 - fillRatio * 240}, 90%, 50%)`
      : `hsl(${120 - fillRatio * 240}, 90%, 50%)`;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * fillRatio, barH, 4);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText(`SIZE ×${player.size.toFixed(2)}`, barX + 4, barY + 2);

    // Throw cooldown dots
    const cdRatio = 1 - Math.max(0, player.throwTimer) / player.throwCooldown;
    ctx.fillStyle = cdRatio >= 1 ? '#FFD700' : '#666';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(cdRatio >= 1 ? '🍄 READY' : `⏳ ${player.throwTimer.toFixed(1)}s`, barX, y + 56);

    // Scores
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${score}`, x + panelW - 10, y + 10);
  }

  private drawTimer(noHitTimer: number): void {
    const ctx = this.ctx;
    const x = CANVAS_W / 2;
    const y = 16;
    const elapsed = NO_HIT_TIMEOUT - noHitTimer;
    const ratio = elapsed / NO_HIT_TIMEOUT; // 0..1

    // Background pill
    const pw = 180;
    const ph = 44;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(x - pw / 2, y, pw, ph, 10);
    ctx.fill();

    // Timer arc
    ctx.strokeStyle = ratio < 0.7
      ? `hsl(${120 - ratio * 171}, 90%, 50%)`
      : '#FF3A3A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y + ph / 2, 16, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
    ctx.stroke();

    // Time text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(noHitTimer).toString().padStart(2, '0') + 's', x + 14, y + ph / 2);
    ctx.fillText('⏱', x - 22, y + ph / 2);
  }

  drawRoundStart(round: number): void {
    this.drawCentreOverlay(`ROUND ${round}`, '3… 2… 1… MUNCH!', '#FFD700', '#FFFFFF');
  }

  drawRoundEnd(winnerName: string, reason: string): void {
    this.drawCentreOverlay(`${winnerName} WINS!`, reason, '#FFD700', '#EEEEEE');
  }

  drawMatchWinner(winnerName: string): void {
    this.drawCentreOverlay(
      `🏆 ${winnerName}`,
      'MATCH WINNER!\nPress SPACE to play again',
      '#FFD700',
      '#FFFFFF',
    );
  }

  drawCountdown(n: number): void {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(0,0,0,${0.3 + (3 - n) * 0.07})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${120 + (3 - n) * 20}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n > 0 ? String(n) : 'GO!', CANVAS_W / 2, CANVAS_H / 2);
  }

  drawScoreboard(scores: [number, number]): void {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('MUNCHROOM', CANVAS_W / 2, 60);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 80px "Courier New", monospace';
    ctx.fillText(`${scores[0]}   –   ${scores[1]}`, CANVAS_W / 2, 160);

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '24px "Courier New", monospace';
    ctx.fillText('P1  (WASD+Q)          P2  (ARROWS+CTRL)', CANVAS_W / 2, 280);
  }

  private drawCentreOverlay(
    title: string,
    subtitle: string,
    titleColor: string,
    subtitleColor: string,
  ): void {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = titleColor;
    ctx.font = 'bold 72px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, CANVAS_W / 2, CANVAS_H / 2 - 40);

    ctx.fillStyle = subtitleColor;
    ctx.font = '28px "Courier New", monospace';
    const lines = subtitle.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_W / 2, CANVAS_H / 2 + 30 + i * 38);
    });
  }
}
