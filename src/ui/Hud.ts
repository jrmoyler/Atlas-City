import { BUILDINGS, TOOLBAR } from "../game/config/buildings";
import type { BuildingId, CityStats } from "../game/types";

type Kind = "info" | "success" | "warn";

/**
 * Thin DOM overlay: top stat bar, bottom build toolbar, a menu button, and a
 * transient toast stack for milestones / warnings. The stat text is rebuilt
 * each frame (cheap); buttons are created once and only their state toggled.
 */
export class Hud {
  private readonly root: HTMLElement;
  private readonly statBar: HTMLElement;
  private readonly toasts: HTMLElement;
  private readonly buttons = new Map<BuildingId, HTMLButtonElement>();

  onSelect: (id: BuildingId) => void = () => {};
  onReset: () => void = () => {};
  onSave: () => void = () => {};

  constructor(root: HTMLElement) {
    this.root = root;

    this.statBar = document.createElement("div");
    this.statBar.className = "hud-bar";
    this.root.appendChild(this.statBar);

    this.toasts = document.createElement("div");
    this.toasts.className = "toasts";
    this.root.appendChild(this.toasts);

    this.buildMenu();
    this.buildToolbar();
  }

  private buildMenu(): void {
    const wrap = document.createElement("div");
    wrap.className = "menu";
    const save = document.createElement("button");
    save.className = "menu-btn";
    save.textContent = "Save";
    save.addEventListener("click", () => this.onSave());
    const reset = document.createElement("button");
    reset.className = "menu-btn";
    reset.textContent = "New City";
    reset.addEventListener("click", () => this.onReset());
    wrap.append(save, reset);
    this.root.appendChild(wrap);
  }

  private buildToolbar(): void {
    const bar = document.createElement("div");
    bar.className = "toolbar";
    for (const id of TOOLBAR) {
      const def = BUILDINGS[id];
      const btn = document.createElement("button");
      btn.className = "tool";
      btn.innerHTML = `${def.name}<small>${
        def.cost > 0 ? "§" + def.cost : "free"
      }</small>`;
      btn.addEventListener("click", () => this.onSelect(id));
      bar.appendChild(btn);
      this.buttons.set(id, btn);
    }
    this.root.appendChild(bar);
  }

  setSelected(id: BuildingId): void {
    for (const [key, btn] of this.buttons) {
      btn.classList.toggle("active", key === id);
    }
  }

  /** Grey out tools the player can't currently afford. */
  updateAffordability(credits: number): void {
    for (const [key, btn] of this.buttons) {
      btn.disabled = BUILDINGS[key].cost > credits;
    }
  }

  updateStats(stats: CityStats): void {
    const money =
      stats.balance >= 0 ? `+§${stats.balance}` : `−§${-stats.balance}`;
    const idle =
      stats.disconnected > 0
        ? `<div class="stat warn"><b>${stats.disconnected}</b><span>No road</span></div>`
        : "";
    this.statBar.innerHTML = `
      ${stat("§" + Math.round(stats.credits).toLocaleString(), "Treasury")}
      ${stat(money + "/day", "Balance")}
      ${stat(stats.population.toLocaleString(), "Population")}
      ${stat(stats.employed.toLocaleString() + "/" + stats.jobs.toLocaleString(), "Employed")}
      ${stat(stats.housing.toLocaleString(), "Housing")}
      ${stat("Day " + stats.day, "Time")}
      ${idle}
    `;
  }

  /** Pop a transient toast; auto-dismisses. */
  notify(message: string, kind: Kind = "info"): void {
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    el.textContent = message;
    this.toasts.appendChild(el);
    // Force reflow so the entrance transition runs, then schedule removal.
    requestAnimationFrame(() => el.classList.add("show"));
    window.setTimeout(() => {
      el.classList.remove("show");
      window.setTimeout(() => el.remove(), 300);
    }, 3200);
  }
}

function stat(value: string, label: string): string {
  return `<div class="stat"><b>${value}</b><span>${label}</span></div>`;
}
