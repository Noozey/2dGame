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
import { Player } from "./classes/player.js";
import { createCollisionMap, createBoundaries } from "./utils/collision.js";
import { key, mouse, initializeInputHandlers } from "./utils/input.js";
import { NetworkManager } from "./network/socket.js";
import { resolveMovement } from "./systems/collisionsystem.js";
import { updateCamera } from "./systems/camerasystem.js";
import { RenderSystem } from "./systems/rendersystem.js";
import {
  backgroundAudio,
  playGunfire,
  startFootsteps,
  stopFootsteps,
} from "./utils/sound.js";
import { assets } from "./assets.js";
import { GunManager } from "./classes/gunManager.js";

// ─── Canvas Setup ────────────────────────────────────────────────────────────
const canvas = document.querySelector("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ─── State ───────────────────────────────────────────────────────────────────
const world = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
const playerPosition = { x: PLAYER_INITIAL_X, y: PLAYER_INITIAL_Y };
let camera = { x: 0, y: 0 };
let frameCount = 0;
let lastTime = 0;
let isFiring = false;

// ─── Systems & Managers ──────────────────────────────────────────────────────
const localPlayer = new Player(0);
const renderer = new RenderSystem(canvas);
const collisionMap = createCollisionMap(collisions);
const boundaries = createBoundaries(collisionMap, Boundary);
const guns = new GunManager({
  handgun: assets.handgun,
  shotgun: assets.shotgun,
  machineGun: assets.machineGun,
  bullet: assets.bullet,
});
const network = new NetworkManager(playerPosition);
const prevPositions = new Map();

// ─── Network Callbacks ───────────────────────────────────────────────────────
network.onHealthUpdate = (newHealth) => {
  localPlayer.health = newHealth;
  window.dispatchEvent(
    new CustomEvent("healthUpdate", { detail: { health: newHealth } }),
  );
};

// ─── Input Handlers ──────────────────────────────────────────────────────────
initializeInputHandlers();

// Gun switch: keys 1 / 2 / 3
window.addEventListener("keydown", (e) => {
  if (e.key === "1") guns.switchGun("handgun");
  if (e.key === "2") guns.switchGun("shotgun");
  if (e.key === "3") guns.switchGun("machineGun");
});

// Mouse: hold to fire, also check hits on other players
canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  isFiring = true;

  // Hit detection against network players
  const networkPlayers = network.getPlayers();
  networkPlayers.forEach((playerData, playerID) => {
    const screenX = playerData.x - camera.x;
    const screenY = playerData.y - camera.y;
    const dist = Math.sqrt((mouse.x - screenX) ** 2 + (mouse.y - screenY) ** 2);
    if (dist <= 32) {
      network.sendHit(playerID);
    }
  });
});

canvas.addEventListener("mouseup", () => (isFiring = false));

// ─── Animation Loop ──────────────────────────────────────────────────────────
function animation(currentTime) {
  // Delta time — capped at 1/30s to avoid huge jumps after tab switch
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  const dt = Math.min(deltaTime, 1 / 30);

  backgroundAudio();

  // --- Input ---
  let moveX = 0,
    moveY = 0;

  if (key.a || key.d || key.s || key.w) {
    startFootsteps();
  } else {
    stopFootsteps();
  }

  if (key.a) moveX -= 1;
  if (key.d) moveX += 1;
  if (key.w) moveY -= 1;
  if (key.s) moveY += 1;

  // --- Movement & Collision ---
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

  // --- Local Player Sprite ---
  if (network.myPlayerNumber !== undefined) {
    localPlayer.setPlayerNumber(network.myPlayerNumber);
  }
  const isMoving = key.a || key.d || key.w || key.s;
  localPlayer.setMoving(isMoving);
  localPlayer.update(playerPosition.x, playerPosition.y);

  // --- Network Players: Interpolation ---
  const networkPlayers = network.getPlayers();

  networkPlayers.forEach((playerData) => {
    playerData.vx = playerData.targetX - playerData.x;
    playerData.vy = playerData.targetY - playerData.y;
    const lerpFactor = 0.2;
    playerData.x += playerData.vx * lerpFactor;
    playerData.y += playerData.vy * lerpFactor;
  });

  // --- Network Players: Sprite Switch (walking vs idle) ---
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

  // --- Flip & Mouse World Position ---
  const flip = mouse.x < canvas.width / 2;
  const mouseWorldX = mouse.x + camera.x;
  const mouseWorldY = mouse.y + camera.y;

  // --- Angle from gun pivot to mouse ---
  const gunPivotX = playerPosition.x + (flip ? 5 : 35);
  const gunPivotY = playerPosition.y + 40;
  const angle = Math.atan2(mouseWorldY - gunPivotY, mouseWorldX - gunPivotX);

  // --- Shooting ---
  if (isFiring) {
    const muzzle = guns.getMuzzlePosition(
      playerPosition.x,
      playerPosition.y,
      angle,
      flip,
    );

    const fired = guns.tryFire(
      muzzle.x,
      muzzle.y,
      angle,
      performance.now(),
      "local",
    );

    if (fired) {
      playGunfire();
    }
  }

  guns.update(dt);

  guns.bullets.forEach((bullet) => {
    if (!bullet.alive) return;
    networkPlayers.forEach((playerData, playerID) => {
      const dx = bullet.x - playerData.x;
      const dy = bullet.y - playerData.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 32) {
        bullet.alive = false;
        network.sendHit(playerID);
      }
    });
  });

  // --- Render ---
  renderer.clear();
  renderer.drawMap(camera);
  renderer.drawBoundaries(boundaries, camera);
  renderer.drawNetworkPlayers(networkPlayers, camera, frameCount);
  renderer.drawPlayer(localPlayer, flip, camera, frameCount);

  // Draws the current gun sprite + all active bullets
  renderer.drawGun(
    guns,
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
