import { BUILDINGS } from "../config/buildings";
import { WORLD } from "../config/world";
import type { Camera } from "../Camera";
import type { Grid } from "../Grid";
import type { BuildingId, TileCoord } from "../types";

/** What to draw as a translucent placement hint under the cursor. */
export interface Preview {
  coord: TileCoord;
  building: BuildingId;
  /** false → invalid (occupied / unaffordable): drawn red. */
  valid: boolean;
}

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

  /**
   * @param dayPhase 0..1 clock used for a subtle day/night sky tint.
   */
  render(
    grid: Grid,
    camera: Camera,
    hover: TileCoord | null,
    preview: Preview | null,
    dayPhase: number,
  ): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewW, this.viewH);
    this.paintSky(dayPhase);

    // Back-to-front: grid.forEach already yields row-major order, which is
    // correct painter's order for this projection.
    grid.forEach((tile, coord) => {
      const def = BUILDINGS[tile.building];
      const hovered = !!hover && hover.x === coord.x && hover.y === coord.y;
      this.drawTile(camera, coord, def.color, def.id, hovered, tile.active);
    });

    if (preview) this.drawPreview(camera, preview);
    this.paintNightOverlay(dayPhase);
  }

  /** Vertical gradient sky, warm at dawn/dusk, deep blue at night. */
  private paintSky(dayPhase: number): void {
    const ctx = this.ctx;
    // brightness: 1 at noon (phase .5), ~0.35 at midnight (phase 0/1).
    const light = 0.35 + 0.65 * Math.sin(Math.PI * dayPhase);
    const top = mix([8, 12, 22], [24, 40, 74], light);
    const bottom = mix([14, 20, 32], [40, 58, 96], light);
    const g = ctx.createLinearGradient(0, 0, 0, this.viewH);
    g.addColorStop(0, rgb(top));
    g.addColorStop(1, rgb(bottom));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.viewW, this.viewH);
  }

  /** A translucent blue veil at night, fading out by day. */
  private paintNightOverlay(dayPhase: number): void {
    const night = 1 - Math.sin(Math.PI * dayPhase); // 0 noon → 1 midnight
    if (night <= 0.02) return;
    this.ctx.fillStyle = `rgba(10, 18, 44, ${0.32 * night})`;
    this.ctx.fillRect(0, 0, this.viewW, this.viewH);
  }

  private drawPreview(camera: Camera, preview: Preview): void {
    const ctx = this.ctx;
    const def = BUILDINGS[preview.building];
    ctx.save();
    ctx.globalAlpha = 0.55;
    const color = preview.valid ? def.color : "#e5484d";
    this.drawTile(camera, preview.coord, color, def.id, true, true);
    ctx.restore();
  }

  private drawTile(
    camera: Camera,
    coord: TileCoord,
    baseColor: string,
    id: string,
    hovered: boolean,
    active: boolean,
  ): void {
    const ctx = this.ctx;
    // Idle (road-disconnected) zones are desaturated toward grey as feedback.
    const color = active ? baseColor : desaturate(baseColor, 0.55);
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

      // "No road" warning: a small amber dot floating over idle zones.
      if (!active) {
        ctx.beginPath();
        ctx.arc(p.x, top + hh * 0.4, Math.max(2, 3 * camera.zoom), 0, Math.PI * 2);
        ctx.fillStyle = "#f5a524";
        ctx.fill();
      }
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

/** Multiply a hex colour's channels toward black (t<0) or white (via lighten). */
function shade(hex: string, t: number): string {
  const { r, g, b } = parseHex(hex);
  const f = (c: number) =>
    Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function lighten(hex: string, t: number): string {
  return shade(hex, Math.abs(t));
}

/** Blend a colour toward its grey luminance by amount t (0..1). */
function desaturate(hex: string, t: number): string {
  const { r, g, b } = parseHex(hex);
  const grey = Math.round(0.3 * r + 0.59 * g + 0.11 * b);
  const f = (c: number) => Math.round(c + (grey - c) * t);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

type RGB = [number, number, number];
function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}
function rgb(c: RGB): string {
  return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
}
