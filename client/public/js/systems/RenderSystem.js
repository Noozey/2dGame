import { Sprite } from "../classes/Sprite.js";
import { assets } from "../assets.js";
import { FRAME_UPDATE_RATE } from "../config/constants.js";

export class RenderSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.c = canvas.getContext("2d");
    this.mapSprite = new Sprite(assets.map);
    this.gunSprite = new Sprite(assets.gun);
    this.crosshairSprite = new Sprite(assets.crosshair);

    this.fogCanvas = document.createElement("canvas");
    this.fogCanvas.width = canvas.width;
    this.fogCanvas.height = canvas.height;
    this.fogCtx = this.fogCanvas.getContext("2d");
  }

  clear() {
    this.c.fillStyle = "#181425";
    this.c.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMap(camera) {
    this.mapSprite.dx = 0;
    this.mapSprite.dy = 0;
    this.mapSprite.draw(false, camera.x, camera.y);
  }

  drawBoundaries(boundaries, camera) {
    boundaries.forEach((b) => b.draw(camera));
  }

  drawPlayer(player, flip, camera, frameCount) {
    player.update(player.x, player.y);
    player.draw(flip, camera.x, camera.y, frameCount);
  }

  drawGun(
    gunManager,
    playerX,
    playerY,
    mouseWorldX,
    mouseWorldY,
    flip,
    camera,
  ) {
    const gunX = flip ? playerX + 5 : playerX + 35;
    const gunY = playerY + 40;
    const angle = Math.atan2(mouseWorldY - gunY, mouseWorldX - gunX);

    gunManager.drawGun(this.c, playerX, playerY, angle, flip, camera);
    gunManager.drawBullets(this.c, camera);
  }

  drawCrosshair(mouseX, mouseY, flip) {
    this.crosshairSprite.dx = mouseX;
    this.crosshairSprite.dy = mouseY;
    this.crosshairSprite.draw(flip, 0, 0);
  }

  drawNetworkPlayers(players, camera, frameCount) {
    players.forEach((playerData) => {
      if (playerData?.sprite) {
        playerData.sprite.dx = playerData.x;
        playerData.sprite.dy = playerData.y;
        playerData.sprite.updateFrame(FRAME_UPDATE_RATE, frameCount);
        playerData.sprite.draw(false, camera.x, camera.y);
      }
    });
  }

  // Darkens everything outside the given visibility polygon (world-space
  // points), with a soft gradient falloff toward the edge of vision instead
  // of a hard cutoff — the polygon itself (from wall raycasting) still hard
  // -clips at actual walls, which is correct; only the *brightness within*
  // vision fades gradually rather than being uniformly bright right up to
  // the boundary.
  drawFogOfWar(
    visibilityPoints,
    originScreenX,
    originScreenY,
    maxDistance,
    camera,
  ) {
    const fc = this.fogCtx;
    fc.save();
    fc.globalCompositeOperation = "source-over";
    fc.clearRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);

    fc.fillStyle = "rgba(4, 6, 8, 0.20)";
    fc.fillRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);

    if (visibilityPoints.length > 2) {
      fc.beginPath();
      const first = visibilityPoints[0];
      fc.moveTo(first.x - camera.x, first.y - camera.y);
      for (let i = 1; i < visibilityPoints.length; i++) {
        const p = visibilityPoints[i];
        fc.lineTo(p.x - camera.x, p.y - camera.y);
      }
      fc.closePath();
      fc.clip();

      fc.globalCompositeOperation = "destination-out";
      const gradient = fc.createRadialGradient(
        originScreenX,
        originScreenY,
        0,
        originScreenX,
        originScreenY,
        maxDistance,
      );
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(0.7, "rgba(0,0,0,1)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      fc.fillStyle = gradient;
      fc.fillRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);
    }

    fc.restore();

    // Composite the finished fog layer onto the already-drawn game scene.
    this.c.drawImage(this.fogCanvas, 0, 0);
  }
}
