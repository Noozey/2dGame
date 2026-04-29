export function updateCamera(playerX, playerY, canvasWidth, canvasHeight) {
  return {
    x: playerX - canvasWidth / 2,
    y: playerY - canvasHeight / 2,
  };
}
