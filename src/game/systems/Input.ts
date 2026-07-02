import type { Camera } from "../Camera";
import type { Point, TileCoord } from "../types";

type PlaceHandler = (tile: TileCoord) => void;

/**
 * Pointer + keyboard input. Supports drag-to-pan, wheel/pinch zoom, and
 * click/drag-to-place. Placement vs. panning is disambiguated by which button
 * is held and how far the pointer moved.
 */
export class Input {
  hover: TileCoord | null = null;
  onPlace: PlaceHandler = () => {};
  onHotkey: (key: string) => void = () => {};

  private dragging = false;
  private panning = false;
  private last: Point = { x: 0, y: 0 };
  private downAt: Point = { x: 0, y: 0 };
  private readonly pointers = new Map<number, Point>();
  private pinchDist = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
  ) {
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", this.onKey);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private local(e: PointerEvent): Point {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private onDown = (e: PointerEvent): void => {
    this.canvas.setPointerCapture(e.pointerId);
    const p = this.local(e);
    this.pointers.set(e.pointerId, p);
    this.downAt = p;
    this.last = p;
    // Right/middle button pans; left button places (but may become a pan-drag).
    this.panning = e.button === 1 || e.button === 2;
    this.dragging = e.button === 0;
    if (this.pointers.size === 2) {
      this.pinchDist = this.twoPointerDist();
    }
  };

  private onMove = (e: PointerEvent): void => {
    const p = this.local(e);
    this.hover = this.camera.screenToTile(p.x, p.y);

    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, p);

    // Two-finger pinch zoom.
    if (this.pointers.size === 2) {
      const dist = this.twoPointerDist();
      if (this.pinchDist > 0) {
        this.camera.zoomBy(dist / this.pinchDist, this.center());
      }
      this.pinchDist = dist;
      return;
    }

    const dx = p.x - this.last.x;
    const dy = p.y - this.last.y;
    this.last = p;

    if (this.panning) {
      this.camera.pan(dx, dy);
      return;
    }
    // Left-drag past a threshold becomes a pan instead of a place-smear.
    if (this.dragging) {
      const moved = Math.hypot(p.x - this.downAt.x, p.y - this.downAt.y);
      if (moved > 8) this.camera.pan(dx, dy);
    }
  };

  private onUp = (e: PointerEvent): void => {
    const p = this.pointers.get(e.pointerId) ?? this.last;
    const moved = Math.hypot(p.x - this.downAt.x, p.y - this.downAt.y);
    // A left click that barely moved is a placement.
    if (this.dragging && moved <= 8) {
      const tile = this.camera.screenToTile(p.x, p.y);
      this.onPlace(tile);
    }
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinchDist = 0;
    this.dragging = false;
    this.panning = false;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const r = this.canvas.getBoundingClientRect();
    const anchor = { x: e.clientX - r.left, y: e.clientY - r.top };
    this.camera.zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1, anchor);
  };

  private onKey = (e: KeyboardEvent): void => {
    this.onHotkey(e.key);
  };

  private twoPointerDist(): number {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private center(): Point {
    const [a, b] = [...this.pointers.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
}
