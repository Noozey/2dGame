import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../config/constants.js";

export const key = {
  a: false,
  d: false,
  s: false,
  w: false,
};

export const mouse = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  left: false,
  middle: false,
  right: false,
};

export function initializeInputHandlers() {
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("keydown", (e) => {
    key[e.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (e) => {
    key[e.key.toLowerCase()] = false;
  });

  window.addEventListener("mousedown", (e) => {
    if (e.button === 0) mouse.left = true;
    if (e.button === 1) mouse.middle = true;
    if (e.button === 2) mouse.right = true;
  });

  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) mouse.left = false;
    if (e.button === 1) mouse.middle = false;
    if (e.button === 2) mouse.right = false;
  });
}
