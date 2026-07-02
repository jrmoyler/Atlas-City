import { WORLD } from "./config/world";
import type { Point, TileCoord } from "./types";

/**
 * Handles panning/zoom and conversion between isometric tile space and
 * screen space. Screen origin (0,0) plus offset places tile (0,0)'s top corner.
 */
export class Camera {
  offsetX = 0;
  offsetY = 0;
  zoom = 1;

  /** Centre the view on the middle of the map for the given viewport. */
  centerOn(viewportW: number, viewportH: number): void {
    const midCol = WORLD.cols / 2;
    const midRow = WORLD.rows / 2;
    const p = this.tileToWorld(midCol, midRow);
    this.offsetX = viewportW / 2 - p.x * this.zoom;
    this.offsetY = viewportH / 2 - p.y * this.zoom;
  }

  pan(dx: number, dy: number): void {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  zoomBy(factor: number, anchor: Point): void {
    const next = clamp(this.zoom * factor, 0.4, 2.5);
    // Keep the anchor point stable while zooming.
    this.offsetX = anchor.x - (anchor.x - this.offsetX) * (next / this.zoom);
    this.offsetY = anchor.y - (anchor.y - this.offsetY) * (next / this.zoom);
    this.zoom = next;
  }

  /** Tile coordinate → un-zoomed world pixel (top corner of the diamond). */
  tileToWorld(x: number, y: number): Point {
    const halfW = WORLD.tileWidth / 2;
    const halfH = WORLD.tileHeight / 2;
    return {
      x: (x - y) * halfW,
      y: (x + y) * halfH,
    };
  }

  /** Tile coordinate → screen pixel. */
  tileToScreen(x: number, y: number): Point {
    const w = this.tileToWorld(x, y);
    return {
      x: w.x * this.zoom + this.offsetX,
      y: w.y * this.zoom + this.offsetY,
    };
  }

  /** Screen pixel → floored tile coordinate under that point. */
  screenToTile(sx: number, sy: number): TileCoord {
    const halfW = WORLD.tileWidth / 2;
    const halfH = WORLD.tileHeight / 2;
    const wx = (sx - this.offsetX) / this.zoom;
    const wy = (sy - this.offsetY) / this.zoom;
    // Invert the isometric transform, then shift so the whole diamond
    // (not just its top corner) maps to the tile.
    const fx = wy / halfH + wx / halfW;
    const fy = wy / halfH - wx / halfW;
    return { x: Math.floor(fx / 2), y: Math.floor(fy / 2) };
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
