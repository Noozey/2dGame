import { GUN_TYPES } from "../config/guns.js";
import { Bullet } from "./Bullet.js";

export class GunManager {
  constructor(images) {
    console.log("GunManager received:", images);
    this.images = images;
    this.currentType = "handgun";
    this.bullets = [];
    this.lastFireTime = 0;
  }

  get config() {
    return GUN_TYPES[this.currentType];
  }

  switchGun(type) {
    if (GUN_TYPES[type]) {
      this.currentType = type;
    }
  }

  tryFire(originX, originY, angle, currentTime, ownerId) {
    const cfg = this.config;
    if (currentTime - this.lastFireTime < cfg.fireRate) return false;
    this.lastFireTime = currentTime;

    if (this.currentType === "shotgun") {
      for (let i = -2; i <= 2; i++) {
        const spread = (i * Math.PI) / 24;
        this.bullets.push(
          new Bullet(
            originX,
            originY,
            angle + spread,
            cfg.bulletSpeed,
            cfg.bulletDamage,
            ownerId,
          ),
        );
      }
    } else {
      this.bullets.push(
        new Bullet(
          originX,
          originY,
          angle,
          cfg.bulletSpeed,
          cfg.bulletDamage,
          ownerId,
        ),
      );
    }
    return true;
  }

  update(dt) {
    this.bullets.forEach((b) => b.update(dt));
    this.bullets = this.bullets.filter((b) => b.alive);
  }

  drawGun(c, playerX, playerY, angle, flip, camera) {
    const img = this.images[this.currentType];
    if (!img?.complete || img.naturalWidth === 0) return;

    const cfg = this.config;
    const gunX = (flip ? playerX + 5 : playerX + cfg.offsetX) - camera.x;
    const gunY = playerY + cfg.offsetY - camera.y;

    c.save(); // ✅ fixed — was corrupted to [c.save](http://c.save)()
    c.translate(gunX, gunY);
    c.rotate(angle);
    if (flip) c.scale(1, -1);
    c.drawImage(
      img,
      -cfg.displayW / 2,
      -cfg.displayH / 2,
      cfg.displayW,
      cfg.displayH,
    );
    c.restore();
  }

  drawBullets(c, camera) {
    const bulletImg = this.images.bullet;
    this.bullets.forEach((b) => b.draw(c, bulletImg, camera));
  }

  getMuzzlePosition(playerX, playerY, angle, flip) {
    const cfg = this.config;
    const gunX = flip ? playerX + 5 : playerX + cfg.offsetX;
    const gunY = playerY + cfg.offsetY;
    const offset = flip ? -cfg.muzzleOffset : cfg.muzzleOffset;
    return {
      x: gunX + Math.cos(angle) * offset,
      y: gunY + Math.sin(angle) * offset,
    };
  }
}
