export class Bullet {
  constructor(x, y, angle, speed, damage, ownerId) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.ownerId = ownerId;
    this.alive = true;
    this.distanceTravelled = 0;
    this.maxDistance = 500;
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;
    const dx = Math.cos(this.angle) * this.speed * dt;
    const dy = Math.sin(this.angle) * this.speed * dt;
    this.x += dx;
    this.y += dy;
    this.distanceTravelled += Math.sqrt(dx * dx + dy * dy);
    if (this.distanceTravelled > this.maxDistance) this.alive = false;
  }

  draw(c, bulletImg, camera) {
    if (!bulletImg?.complete || bulletImg.naturalWidth === 0) return;
    c.save();
    c.translate(this.x - camera.x, this.y - camera.y);
    c.rotate(this.angle);
    c.drawImage(bulletImg, -8, -4, 16, 7);
    c.restore();
  }
}
