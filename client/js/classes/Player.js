import { Sprite } from "./Sprite.js";
import { assets } from "../assets.js";
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  FRAME_UPDATE_RATE,
} from "../config/constants.js";

export class Player {
  constructor(playerNumber = 0) {
    this.x = 0;
    this.y = 0;
    this.health = 100;
    this.playerNumber = playerNumber;
    this.sprite = new Sprite(this._idleImg(), 6);
  }

  _idleImg() {
    return this.playerNumber === 0 ? assets.player1Idle : assets.player2Idle;
  }

  _walkImg() {
    return this.playerNumber === 0
      ? assets.player1Walking
      : assets.player2Walking;
  }

  setMoving(isMoving) {
    if (isMoving) {
      this.sprite.img = this._walkImg();
      this.sprite.frames = 8;
    } else {
      this.sprite.img = this._idleImg();
      this.sprite.frames = 6;
    }
  }

  setPlayerNumber(num) {
    this.playerNumber = num;
    this.setMoving(false);
  }

  update(x, y) {
    this.x = x;
    this.y = y;
    this.sprite.dx = x;
    this.sprite.dy = y;
  }

  draw(flip, cameraX, cameraY, frameCount) {
    this.sprite.updateFrame(FRAME_UPDATE_RATE, frameCount);
    this.sprite.draw(flip, cameraX, cameraY);
  }

  get width() {
    return PLAYER_WIDTH;
  }
  get height() {
    return PLAYER_HEIGHT;
  }
}
