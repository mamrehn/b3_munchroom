// ──────────────────────────────────────────────
//  MUNCHROOM – Camera (slow zoom-out)
// ──────────────────────────────────────────────
import {
  CANVAS_W, CANVAS_H,
  WORLD_W, WORLD_H,
  CAMERA_ZOOM_SPEED,
  CAMERA_MIN_ZOOM,
} from './constants';
import type { Vec2 } from './constants';

export class Camera {
  /** Current world→canvas zoom (1.0 = 1:1). Starts so world fits canvas. */
  zoom: number;
  /** Top-left of viewport in world space */
  x = 0;
  y = 0;

  constructor() {
    // Start zoomed in; the game slowly zooms out to reveal the world horizontally
    this.zoom = 1.0;
  }

  /** Call each frame with two player world positions. */
  update(dt: number, p1: Vec2, p2: Vec2): void {
    // Zoom out slowly
    this.zoom = Math.max(CAMERA_MIN_ZOOM, this.zoom - CAMERA_ZOOM_SPEED * dt);

    // ── Horizontal: track player midpoint, clamp to world ──────────────────
    const vw = CANVAS_W / this.zoom;
    const cx = (p1.x + p2.x) / 2;
    this.x = Math.max(0, Math.min(WORLD_W - vw, cx - vw / 2));

    // ── Vertical: anchor the ground so it always appears near the bottom ───
    // We want the ground surface (WORLD_H - 60) to sit at canvas y = CANVAS_H - 30,
    // so the floor never drifts regardless of zoom level.
    //   (groundWorldY - camera.y) * zoom = FLOOR_CANVAS_Y
    //   camera.y = groundWorldY - FLOOR_CANVAS_Y / zoom
    const FLOOR_CANVAS_Y = CANVAS_H - 30;  // pixels from canvas top to ground
    const groundWorldY = WORLD_H - 60;
    this.y = groundWorldY - FLOOR_CANVAS_Y / this.zoom;
    if (this.y < 0) this.y = 0;            // never scroll above world top
  }

  /** Convert a world-space point to canvas-space. */
  worldToCanvas(wx: number, wy: number): Vec2 {
    return {
      x: (wx - this.x) * this.zoom,
      y: (wy - this.y) * this.zoom,
    };
  }

  /** Scale a world-space length to canvas-space. */
  scaleLen(len: number): number {
    return len * this.zoom;
  }

  /** Apply camera transform to a CanvasRenderingContext2D. */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.x * this.zoom, -this.y * this.zoom);
  }
}
