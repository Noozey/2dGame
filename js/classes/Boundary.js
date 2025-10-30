export class Boundary {
  constructor({ position, width }) {
    this.position = position;
    this.width = width || 64;
    this.height = 64;
  }

  draw(camera) {
    const c = document.querySelector("canvas").getContext("2d");
    c.fillStyle = "transparent";
    c.fillRect(
      this.position.x - camera.x,
      this.position.y - camera.y,
      this.width,
      this.height,
    );
  }
}
