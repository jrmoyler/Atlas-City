import { BUILDINGS } from "../config/buildings";
import { WORLD } from "../config/world";
import type { Camera } from "../Camera";
import type { Grid } from "../Grid";
import type { TileCoord } from "../types";

/**
 * Placeholder isometric renderer using flat-shaded diamonds + extruded blocks.
 * Deliberately art-free so it runs with zero assets; swap for sprites/Three.js
 * later without touching the simulation.
 */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
  }

  /** Resize backing store to device pixels for crisp rendering. */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private get viewW(): number {
    return this.canvas.clientWidth;
  }
  private get viewH(): number {
    return this.canvas.clientHeight;
  }

  render(grid: Grid, camera: Camera, hover: TileCoord | null): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewW, this.viewH);
    ctx.fillStyle = "#0e1420";
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    // Back-to-front: grid.forEach already yields row-major order, which is
    // correct painter's order for this projection.
    grid.forEach((tile, coord) => {
      const def = BUILDINGS[tile.building];
      const hovered = !!hover && hover.x === coord.x && hover.y === coord.y;
      this.drawTile(camera, coord, def.color, def.id, hovered);
    });
  }

  private drawTile(
    camera: Camera,
    coord: TileCoord,
    color: string,
    id: string,
    hovered: boolean,
  ): void {
    const ctx = this.ctx;
    const p = camera.tileToScreen(coord.x, coord.y);
    const hw = (WORLD.tileWidth / 2) * camera.zoom;
    const hh = (WORLD.tileHeight / 2) * camera.zoom;

    // Ground diamond.
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + hw, p.y + hh);
    ctx.lineTo(p.x, p.y + hh * 2);
    ctx.lineTo(p.x - hw, p.y + hh);
    ctx.closePath();
    ctx.fillStyle = hovered ? lighten(color, 0.25) : color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Extrude built tiles into a simple block for depth.
    const height = blockHeight(id) * camera.zoom;
    if (height > 0) {
      const top = p.y - height;
      // Left face.
      ctx.beginPath();
      ctx.moveTo(p.x - hw, p.y + hh);
      ctx.lineTo(p.x, p.y + hh * 2);
      ctx.lineTo(p.x, p.y + hh * 2 - height);
      ctx.lineTo(p.x - hw, p.y + hh - height);
      ctx.closePath();
      ctx.fillStyle = shade(color, -0.28);
      ctx.fill();
      // Right face.
      ctx.beginPath();
      ctx.moveTo(p.x + hw, p.y + hh);
      ctx.lineTo(p.x, p.y + hh * 2);
      ctx.lineTo(p.x, p.y + hh * 2 - height);
      ctx.lineTo(p.x + hw, p.y + hh - height);
      ctx.closePath();
      ctx.fillStyle = shade(color, -0.14);
      ctx.fill();
      // Top face.
      ctx.beginPath();
      ctx.moveTo(p.x, top);
      ctx.lineTo(p.x + hw, top + hh);
      ctx.lineTo(p.x, top + hh * 2);
      ctx.lineTo(p.x - hw, top + hh);
      ctx.closePath();
      ctx.fillStyle = shade(color, 0.08);
      ctx.fill();
    }
  }
}

function blockHeight(id: string): number {
  switch (id) {
    case "residential":
      return 18;
    case "commercial":
      return 22;
    case "industrial":
      return 26;
    case "park":
      return 6;
    default:
      return 0;
  }
}

/** Multiply a hex colour's channels toward black (t<0) or white via lighten. */
function shade(hex: string, t: number): string {
  const { r, g, b } = parseHex(hex);
  const f = (c: number) =>
    Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function lighten(hex: string, t: number): string {
  return shade(hex, Math.abs(t));
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
