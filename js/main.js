import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_INITIAL_X,
  PLAYER_INITIAL_Y,
  MOVE_SPEED,
  FRAME_UPDATE_RATE,
  GUN_OFFSET_X,
  GUN_OFFSET_Y,
  HEAD_ADJUSTMENT,
} from "./config/constants.js";
import { collisions } from "./config/collisions.js";
import { Sprite } from "./classes/Sprite.js";
import { Boundary } from "./classes/Boundary.js";
import {
  checkCollision,
  createCollisionMap,
  createBoundaries,
} from "./utils/collision.js";
import { key, mouse, initializeInputHandlers } from "./utils/input.js";
import { NetworkManager } from "./network/socket.js";

// Canvas setup
const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const playerPosition = {
  x: PLAYER_INITIAL_X,
  y: PLAYER_INITIAL_Y,
};

const world = {
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
};

const camera = {
  x: world.width,
  y: world.height,
};

const player1Idle = new Image();
player1Idle.src = "./img/player1/idle.png";

const player1Walking = new Image();
player1Walking.src = "./img/player1/walking.png";

const gunImg = new Image();
gunImg.src = "./img/weapon.png";

const crosshairImg = new Image();
crosshairImg.src = "./img/crosshair.png";

const shootImg = new Image();
shootImg.src = "./img/muzzle.png";

const mapImg = new Image();
mapImg.src = "./img/map.png";

const player = new Sprite(player1Idle);
const gun = new Sprite(gunImg);
const crosshair = new Sprite(crosshairImg);
const map = new Sprite(mapImg);

const collisionsMap = createCollisionMap(collisions);
const boundaries = createBoundaries(collisionsMap, Boundary);

const networkManager = new NetworkManager(playerPosition);

initializeInputHandlers();

let lastTime = 0;
let frameCount = 0;

function animation(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  const clampedDeltaTime = Math.min(deltaTime, 1 / 30);

  c.fillStyle = "#181425";
  c.fillRect(0, 0, canvas.width, canvas.height);

  let moveX = 0;
  let moveY = 0;

  if (key.a) moveX -= 1;
  if (key.d) moveX += 1;
  if (key.w) moveY -= 1;
  if (key.s) moveY += 1;

  const movementX = moveX * MOVE_SPEED * clampedDeltaTime;
  const movementY = moveY * MOVE_SPEED * clampedDeltaTime;

  const testPosX = {
    x: playerPosition.x + movementX,
    y: playerPosition.y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };

  let horizontalCollision = false;
  for (let boundary of boundaries) {
    const boundaryRect = {
      x: boundary.position.x,
      y: boundary.position.y,
      width: boundary.width,
      height: boundary.height,
    };

    if (checkCollision(testPosX, boundaryRect)) {
      horizontalCollision = true;
      break;
    }
  }

  if (!horizontalCollision) {
    playerPosition.x = testPosX.x;
  }

  const testPosY = {
    x: playerPosition.x,
    y: playerPosition.y + movementY,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };

  let verticalCollision = false;
  for (let boundary of boundaries) {
    const boundaryRect = {
      x: boundary.position.x,
      y: boundary.position.y,
      width: boundary.width,
      height: boundary.height,
    };

    if (checkCollision(testPosY, boundaryRect)) {
      verticalCollision = true;
      break;
    }
  }

  if (!verticalCollision) {
    playerPosition.y = testPosY.y;
  } else if (movementY < 0) {
    const adjustedTestPos = {
      x: playerPosition.x,
      y: playerPosition.y + movementY + HEAD_ADJUSTMENT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    };

    let adjustedCollision = false;
    for (let boundary of boundaries) {
      const boundaryRect = {
        x: boundary.position.x,
        y: boundary.position.y,
        width: boundary.width,
        height: boundary.height,
      };

      if (checkCollision(adjustedTestPos, boundaryRect)) {
        adjustedCollision = true;
        break;
      }
    }

    if (!adjustedCollision) {
      playerPosition.y = adjustedTestPos.y;
    }
  }

  playerPosition.x = Math.max(
    0,
    Math.min(playerPosition.x, world.width - PLAYER_WIDTH),
  );
  playerPosition.y = Math.max(
    0,
    Math.min(playerPosition.y, world.height - PLAYER_HEIGHT),
  );

  camera.x = playerPosition.x - canvas.width / 2;
  camera.y = playerPosition.y - canvas.height / 2;

  if (key.a || key.d || key.w || key.s) {
    player.img = player1Walking;
    player.frames = 8;
  } else {
    player.img = player1Idle;
    player.frames = 6;
  }

  player.dx = playerPosition.x;
  player.dy = playerPosition.y;

  const centerX = canvas.width / 2;
  const flipPlayer = mouse.x < centerX;

  map.dx = 0;
  map.dy = 0;
  map.draw(false, camera.x, camera.y);

  boundaries.forEach((boundary) => {
    boundary.draw(camera);
  });

  const players = networkManager.getPlayers();
  players.forEach((playerData, id) => {
    if (playerData && playerData.sprite) {
      playerData.sprite.dx = playerData.x;
      playerData.sprite.dy = playerData.y;
      playerData.sprite.updateFrame(FRAME_UPDATE_RATE, frameCount);
      playerData.sprite.draw(false, camera.x, camera.y);
    }
  });

  player.updateFrame(FRAME_UPDATE_RATE, frameCount);
  player.draw(flipPlayer, camera.x, camera.y);

  const mouseWorldX = mouse.x + camera.x;
  const mouseWorldY = mouse.y + camera.y;

  const gunX = flipPlayer ? playerPosition.x + 5 : playerPosition.x + 35;
  const gunY = playerPosition.y + 40;

  const angle = Math.atan2(mouseWorldY - gunY, mouseWorldX - gunX);

  gun.dx = gunX;
  gun.dy = gunY;
  gun.angle = angle;

  gun.draw(flipPlayer, camera.x, camera.y);

  crosshair.dx = mouse.x;
  crosshair.dy = mouse.y;
  crosshair.draw(flipPlayer, 0, 0);

  frameCount++;
  requestAnimationFrame(animation);
}

requestAnimationFrame(animation);
