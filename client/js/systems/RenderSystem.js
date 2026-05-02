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
}
