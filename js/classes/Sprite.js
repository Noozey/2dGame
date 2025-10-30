export class Sprite {
  constructor(img, frames = 1) {
    this.img = img;
    this.frames = frames;
    this.currentFrame = 0;
    this.dx = 0;
    this.dy = 0;
    this.angle = 0;
  }

  updateFrame(rate, frameCount) {
    if (frameCount % rate === 0) {
      this.currentFrame = (this.currentFrame + 1) % this.frames;
    }
  }

  draw(flip = false, cameraX = 0, cameraY = 0) {
    const c = document.querySelector("canvas").getContext("2d");
    if (!this.img.complete) return;

    const frameWidth = this.img.width / this.frames;
    const frameHeight = this.img.height;

    c.save();

    if (this.angle !== 0) {
      c.translate(this.dx - cameraX, this.dy - cameraY);
      c.rotate(this.angle);

      if (flip) {
        c.scale(1, -1);
      }

      c.drawImage(
        this.img,
        this.currentFrame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        -frameWidth * 0.2,
        -frameHeight / 2,
        frameWidth,
        frameHeight,
      );
    } else {
      if (flip) {
        c.scale(-1, 1);
        c.drawImage(
          this.img,
          this.currentFrame * frameWidth,
          0,
          frameWidth,
          frameHeight,
          -(this.dx - cameraX + frameWidth),
          this.dy - cameraY,
          frameWidth,
          frameHeight,
        );
      } else {
        c.drawImage(
          this.img,
          this.currentFrame * frameWidth,
          0,
          frameWidth,
          frameHeight,
          this.dx - cameraX,
          this.dy - cameraY,
          frameWidth,
          frameHeight,
        );
      }
    }

    c.restore();
  }
}
