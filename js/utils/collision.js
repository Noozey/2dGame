import { HEAD_HEIGHT, LEGS_HEIGHT_ADJUSTMENT } from "../config/constants.js";

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
  for (let i = 0; i < collisions.length; i += 96) {
    collisionsMap.push(collisions.slice(i, 96 + i));
  }
  return collisionsMap;
}

export function createBoundaries(collisionsMap, Boundary) {
  const boundaries = [];

  collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
      if (symbol === 1156) {
        boundaries.push(
          new Boundary({
            position: {
              x: j * 64,
              y: i * 64,
            },
          }),
        );
      }

      if (symbol === 3221226631) {
        boundaries.push(
          new Boundary({
            position: {
              x: j * 64,
              y: i * 64,
            },
            width: 24,
          }),
        );
      }

      if (symbol === 1161) {
        boundaries.push(
          new Boundary({
            position: {
              x: j * 64 + 40,
              y: i * 64,
            },
            width: 24,
          }),
        );
      }
    });
  });

  return boundaries;
}
