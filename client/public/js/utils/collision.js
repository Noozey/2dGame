import { HEAD_HEIGHT, LEGS_HEIGHT_ADJUSTMENT } from "../config/constants.js";

export const MAP_COLS = 20;
export const MAP_ROWS = 15;
export const TILE_SIZE = 64;

export function checkCollision(rect1, rect2, checkOnlyLegs = true) {
  let checkRect = rect1;
  if (checkOnlyLegs) {
    const legsHeight = rect1.height - HEAD_HEIGHT + LEGS_HEIGHT_ADJUSTMENT;
    checkRect = {
      x: rect1.x,
      y: rect1.y + HEAD_HEIGHT,
      width: rect1.width,
      height: legsHeight,
    };
  }
  return (
    checkRect.x < rect2.x + rect2.width &&
    checkRect.x + checkRect.width > rect2.x &&
    checkRect.y < rect2.y + rect2.height &&
    checkRect.y + checkRect.height > rect2.y
  );
}

export function createCollisionMap(collisions) {
  const collisionsMap = [];
  for (let i = 0; i < collisions.length; i += MAP_COLS) {
    collisionsMap.push(collisions.slice(i, MAP_COLS + i));
  }
  return collisionsMap;
}

export function createBoundaries(collisionsMap, Boundary) {
  const boundaries = [];
  collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
      if (symbol === 1) {
        boundaries.push(
          new Boundary({
            position: { x: j * TILE_SIZE, y: i * TILE_SIZE },
          }),
        );
      }
    });
  });
  return boundaries;
}
