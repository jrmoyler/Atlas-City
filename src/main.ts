import { Game } from "./game/Game";

const canvas = document.getElementById("game");
const hud = document.getElementById("hud");

if (!(canvas instanceof HTMLCanvasElement) || !hud) {
  throw new Error("Atlas City: required DOM elements #game / #hud not found");
}

const game = new Game(canvas, hud);
game.start();
