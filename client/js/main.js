import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  MOVE_SPEED,
  PLAYER_INITIAL_X,
  PLAYER_INITIAL_Y,
} from "./config/constants.js";
import { collisions } from "./config/collisions.js";
import { Boundary } from "./classes/Boundary.js";
import { Player } from "./classes/Player.js";
import { createCollisionMap, createBoundaries } from "./utils/collision.js";
import { key, mouse, initializeInputHandlers } from "./utils/input.js";
import { NetworkManager } from "./network/socket.js";
import { resolveMovement } from "./systems/CollisionSystem.js";
import { updateCamera } from "./systems/CameraSystem.js";
import { RenderSystem } from "./systems/RenderSystem.js";
import { playGunfire } from "./utils/sound.js";
import { assets } from "./assets.js";

const canvas = document.querySelector("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const world = { width: WORLD_WIDTH, height: WORLD_HEIGHT };

const playerPosition = { x: PLAYER_INITIAL_X, y: PLAYER_INITIAL_Y };
let camera = { x: 0, y: 0 };
let frameCount = 0;
let lastTime = 0;

const localPlayer = new Player(0);
const renderer = new RenderSystem(canvas);
const collisionsMap = createCollisionMap(collisions);
const boundaries = createBoundaries(collisionsMap, Boundary);
const networkManager = new NetworkManager(playerPosition);

networkManager.onHealthUpdate = (newHealth) => {
  localPlayer.health = newHealth;
  window.dispatchEvent(
    new CustomEvent("healthUpdate", { detail: { health: newHealth } }),
  );
};

const prevPositions = new Map();

initializeInputHandlers();

canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;

  playGunfire();

  const networkPlayers = networkManager.getPlayers();
  networkPlayers.forEach((playerData, playerID) => {
    const screenX = playerData.x - camera.x;
    const screenY = playerData.y - camera.y;
    const dist = Math.sqrt((mouse.x - screenX) ** 2 + (mouse.y - screenY) ** 2);
    if (dist <= 32) {
      networkManager.sendHit(playerID);
    }
  });
});

function animation(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  const dt = Math.min(deltaTime, 1 / 30);

  // --- Input ---
  let moveX = 0,
    moveY = 0;
  if (key.a) moveX -= 1;
  if (key.d) moveX += 1;
  if (key.w) moveY -= 1;
  if (key.s) moveY += 1;

  // --- Movement & collision ---
  const resolved = resolveMovement(
    playerPosition,
    moveX * MOVE_SPEED * dt,
    moveY * MOVE_SPEED * dt,
    boundaries,
    world,
  );
  playerPosition.x = resolved.x;
  playerPosition.y = resolved.y;

  // --- Camera ---
  camera = updateCamera(
    playerPosition.x,
    playerPosition.y,
    canvas.width,
    canvas.height,
  );

  // --- Local player sprite ---
  if (networkManager.myPlayerNumber !== undefined) {
    localPlayer.setPlayerNumber(networkManager.myPlayerNumber);
  }
  const isMoving = key.a || key.d || key.w || key.s;
  localPlayer.setMoving(isMoving);
  localPlayer.update(playerPosition.x, playerPosition.y);

  const networkPlayers = networkManager.getPlayers();

  networkPlayers.forEach((playerData) => {
    playerData.vx = playerData.targetX - playerData.x;
    playerData.vy = playerData.targetY - playerData.y;

    const lerpFactor = 0.2;
    playerData.x += playerData.vx * lerpFactor;
    playerData.y += playerData.vy * lerpFactor;
  });
  networkPlayers.forEach((playerData, id) => {
    const prev = prevPositions.get(id);
    const moving =
      prev &&
      (Math.abs(prev.x - playerData.x) > 0.5 ||
        Math.abs(prev.y - playerData.y) > 0.5);
    prevPositions.set(id, { x: playerData.x, y: playerData.y });

    if (playerData.sprite) {
      const num = playerData.playerNumber ?? 0;
      if (moving) {
        playerData.sprite.img =
          num === 0 ? assets.player1Walking : assets.player2Walking;
        playerData.sprite.frames = 8;
      } else {
        playerData.sprite.img =
          num === 0 ? assets.player1Idle : assets.player2Idle;
        playerData.sprite.frames = 6;
      }
    }
  });

  const flip = mouse.x < canvas.width / 2;
  const mouseWorldX = mouse.x + camera.x;
  const mouseWorldY = mouse.y + camera.y;

  renderer.clear();
  renderer.drawMap(camera);
  renderer.drawBoundaries(boundaries, camera);
  renderer.drawNetworkPlayers(networkPlayers, camera, frameCount);
  renderer.drawPlayer(localPlayer, flip, camera, frameCount);
  renderer.drawGun(
    playerPosition.x,
    playerPosition.y,
    mouseWorldX,
    mouseWorldY,
    flip,
    camera,
  );
  renderer.drawCrosshair(mouse.x, mouse.y, flip);

  frameCount++;
  requestAnimationFrame(animation);
}

requestAnimationFrame(animation);
