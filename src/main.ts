// ──────────────────────────────────────────────
//  MUNCHROOM – Entry point
// ──────────────────────────────────────────────
import { Game } from './game';
import { CANVAS_W, CANVAS_H } from './constants';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  // Touch-unfocus any element so keyboard input works immediately
  (document.activeElement as HTMLElement | null)?.blur();

  const game = new Game(canvas);
  game.start();
});
