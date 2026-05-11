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
    this.zoom = Math.min(CANVAS_W / WORLD_W, CANVAS_H / WORLD_H);
  }

  /** Call each frame with two player world positions. */
  update(dt: number, p1: Vec2, p2: Vec2): void {
    // Zoom out slowly
    this.zoom = Math.max(CAMERA_MIN_ZOOM, this.zoom - CAMERA_ZOOM_SPEED * dt);

    // Centre viewport between the two players
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;

    this.x = cx - (CANVAS_W / this.zoom) / 2;
    this.y = cy - (CANVAS_H / this.zoom) / 2;

    // Clamp to world bounds
    const vw = CANVAS_W / this.zoom;
    const vh = CANVAS_H / this.zoom;
    this.x = Math.max(0, Math.min(WORLD_W - vw, this.x));
    this.y = Math.max(0, Math.min(WORLD_H - vh, this.y));
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
