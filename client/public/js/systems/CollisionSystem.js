import { checkCollision } from "../utils/collision.js";
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  HEAD_ADJUSTMENT,
} from "../config/constants.js";

function toBoundaryRect(boundary) {
  return {
    x: boundary.position.x,
    y: boundary.position.y,
    width: boundary.width,
    height: boundary.height,
  };
}

function hasCollision(rect, boundaries) {
  for (const boundary of boundaries) {
    if (checkCollision(rect, toBoundaryRect(boundary))) return true;
  }
  return false;
}

export function resolveMovement(
  position,
  movementX,
  movementY,
  boundaries,
  world,
) {
  let { x, y } = position;

  // Horizontal
  const testX = {
    x: x + movementX,
    y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };
  if (!hasCollision(testX, boundaries)) {
    x = testX.x;
  }

  const testY = {
    x,
    y: y + movementY,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };
  if (!hasCollision(testY, boundaries)) {
    y = testY.y;
  } else if (movementY < 0) {
    const adjusted = {
      x,
      y: y + movementY + HEAD_ADJUSTMENT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    };
    if (!hasCollision(adjusted, boundaries)) {
      y = adjusted.y;
    }
  }

  x = Math.max(0, Math.min(x, world.width - PLAYER_WIDTH));
  y = Math.max(0, Math.min(y, world.height - PLAYER_HEIGHT));

  return { x, y };
}
