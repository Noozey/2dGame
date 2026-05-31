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
    switch (this.playerNumber) {
      case 0:
        return assets.player1Idle;
      case 1:
        return assets.player2Idle;
      case 2:
        return assets.player3Idle;
      case 3:
        return assets.player4Idle;
    }
  }

  _walkImg() {
    switch (this.playerNumber) {
      case 0:
        return assets.player1Walking;
      case 1:
        return assets.player2Walking;
      case 2:
        return assets.player3Walking;
      case 3:
        return assets.player4Walking;
    }
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
