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
import {
  backgroundAudio,
  playGunfire,
  startFootsteps,
  stopFootsteps,
  maybePlayOpponentFootstep,
} from "./utils/sound.js";
import { assets } from "./assets.js";
import { GunManager } from "./classes/gunManager.js";

// ─── Wait for React to signal game start ─────────────────────────────────────
window.addEventListener("gameStart", () => {
  initGame();
});

function initGame() {
  // ─── Canvas Setup ──────────────────────────────────────────────────────────
  const canvas = document.querySelector("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // ─── State ─────────────────────────────────────────────────────────────────
  const world = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
  const playerPosition = { x: PLAYER_INITIAL_X, y: PLAYER_INITIAL_Y };
  let camera = { x: 0, y: 0 };
  let frameCount = 0;
  let lastTime = 0;
  let isFiring = false;
  let animFrameId;
  let isDead = false;

  // ─── Systems & Managers ────────────────────────────────────────────────────
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

  // ✅ Socket is already connected and in a room — set by App.tsx
  const network = new NetworkManager(playerPosition);
  const prevPositions = new Map();

  // ─── Network Callbacks ─────────────────────────────────────────────────────
  network.onHealthUpdate = (newHealth) => {
    localPlayer.health = newHealth;
    window.dispatchEvent(
      new CustomEvent("healthUpdate", { detail: { health: newHealth } }),
    );
  };

  // ─── Input Handlers ────────────────────────────────────────────────────────
  initializeInputHandlers(canvas);

  window.addEventListener("keydown", (e) => {
    if (e.key === "1") guns.switchGun("handgun");
    if (e.key === "2") guns.switchGun("shotgun");
    if (e.key === "3") guns.switchGun("machineGun");
  });

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    isFiring = true;
  });

  canvas.addEventListener("mouseup", () => (isFiring = false));

  // ─── Death / Respawn ───────────────────────────────────────────────────────
  window.addEventListener("localPlayerDied", () => {
    isDead = true;
    isFiring = false;
    stopFootsteps();
  });

  window.addEventListener("localPlayerRespawned", () => {
    isDead = false;
  });

  // React's death screen asks the network for a respawn
  window.addEventListener("requestRespawn", () => {
    network.sendRespawn();
  });

  // ─── Stop game if disconnected ─────────────────────────────────────────────
  window.__gameSocket.addEventListener("close", () => {
    console.log("Disconnected from server");
    cancelAnimationFrame(animFrameId);
    // Tell React to go back to menu
    window.dispatchEvent(new CustomEvent("gameOver"));
  });

  // ─── Animation Loop ────────────────────────────────────────────────────────
  function animation(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    const dt = Math.min(deltaTime, 1 / 30);

    backgroundAudio();

    // --- Input ---
    let moveX = 0,
      moveY = 0;

    if (!isDead && (key.a || key.d || key.s || key.w)) startFootsteps();
    else stopFootsteps();

    if (!isDead) {
      if (key.a) moveX -= 1;
      if (key.d) moveX += 1;
      if (key.w) moveY -= 1;
      if (key.s) moveY += 1;
    }

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
    const isMoving = !isDead && (key.a || key.d || key.w || key.s);
    localPlayer.setMoving(isMoving);
    localPlayer.update(playerPosition.x, playerPosition.y);

    // --- Network Players: Interpolation ---
    const networkPlayers = network.getPlayers();
    networkPlayers.forEach((playerData) => {
      playerData.vx = playerData.targetX - playerData.x;
      playerData.vy = playerData.targetY - playerData.y;
      playerData.x += playerData.vx * 0.2;
      playerData.y += playerData.vy * 0.2;
    });

    // --- Network Players: Sprite Switch ---
    networkPlayers.forEach((playerData, id) => {
      const prev = prevPositions.get(id);
      const moving =
        prev &&
        (Math.abs(prev.x - playerData.x) > 0.5 ||
          Math.abs(prev.y - playerData.y) > 0.5);
      prevPositions.set(id, { x: playerData.x, y: playerData.y });

      // Directional footsteps: panned left/right by where they are relative
      // to us, and quieter the farther away they are (covers "up/down" too,
      // since distance factors in both axes).
      const dx = playerData.x - playerPosition.x;
      const dy = playerData.y - playerPosition.y;
      maybePlayOpponentFootstep(id, dx, dy, moving, performance.now());

      if (playerData.sprite) {
        const num = playerData.playerNumber ?? 0;

        switch (num) {
          case 0:
            if (moving) {
              playerData.sprite.img = assets.player1Walking;
              playerData.sprite.frames = 8;
            } else {
              playerData.sprite.img = assets.player1Idle;
              playerData.sprite.frames = 6;
            }
            break;

          case 1:
            if (moving) {
              playerData.sprite.img = assets.player2Walking;
              playerData.sprite.frames = 8;
            } else {
              playerData.sprite.img = assets.player2Idle;
              playerData.sprite.frames = 6;
            }
            break;

          case 2:
            if (moving) {
              playerData.sprite.img = assets.player3Walking;
              playerData.sprite.frames = 8;
            } else {
              playerData.sprite.img = assets.player3Idle;
              playerData.sprite.frames = 6;
            }
            break;

          case 3:
            if (moving) {
              playerData.sprite.img = assets.player4Walking;
              playerData.sprite.frames = 8;
            } else {
              playerData.sprite.img = assets.player4Idle;
              playerData.sprite.frames = 6;
            }
            break;
        }
      }
    });

    // --- Flip & Mouse World Position ---
    const flip = mouse.x < canvas.width / 2;
    const mouseWorldX = mouse.x + camera.x;
    const mouseWorldY = mouse.y + camera.y;

    // --- Angle ---
    const gunPivotX = playerPosition.x + (flip ? 5 : 35);
    const gunPivotY = playerPosition.y;
    const angle = Math.atan2(mouseWorldY - gunPivotY, mouseWorldX - gunPivotX);

    // --- Shooting ---
    if (isFiring && !isDead) {
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
      if (fired) playGunfire();
    }

    guns.update(dt);

    function segmentIntersectsAABB(x1, y1, x2, y2, bx, by, bw, bh) {
      // Check if segment (x1,y1)->(x2,y2) crosses the boundary rectangle
      const minX = Math.min(x1, x2),
        maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2),
        maxY = Math.max(y1, y2);
      if (maxX < bx || minX > bx + bw || maxY < by || minY > by + bh)
        return false;

      const dx = x2 - x1,
        dy = y2 - y1;
      const tMinX = dx !== 0 ? (bx - x1) / dx : -Infinity;
      const tMaxX = dx !== 0 ? (bx + bw - x1) / dx : Infinity;
      const tMinY = dy !== 0 ? (by - y1) / dy : -Infinity;
      const tMaxY = dy !== 0 ? (by + bh - y1) / dy : Infinity;

      const tEnter = Math.max(Math.min(tMinX, tMaxX), Math.min(tMinY, tMaxY));
      const tExit = Math.min(Math.max(tMinX, tMaxX), Math.max(tMinY, tMaxY));
      return tExit >= 0 && tEnter <= 1 && tEnter <= tExit;
    }

    // --- Wall collision (raycast per bullet) ---
    guns.bullets.forEach((bullet) => {
      if (!bullet.alive) return;
      for (const boundary of boundaries) {
        if (
          segmentIntersectsAABB(
            bullet.prevX,
            bullet.prevY,
            bullet.x,
            bullet.y,
            boundary.position.x,
            boundary.position.y,
            boundary.width,
            boundary.height,
          )
        ) {
          bullet.alive = false;
          break;
        }
      }
    });

    // --- Player hit detection ---
    guns.bullets.forEach((bullet) => {
      if (!bullet.alive) return;
      networkPlayers.forEach((playerData, playerID) => {
        // Offset to the center of the sprite (adjust SPRITE_W/H to match your sprite size)
        const SPRITE_W = 57;
        const SPRITE_H = 57;
        const centerX = playerData.x + SPRITE_W / 2;
        const centerY = playerData.y + SPRITE_H / 2;

        const dx = bullet.x - centerX;
        const dy = bullet.y - centerY;
        if (Math.sqrt(dx * dx + dy * dy) <= 32) {
          bullet.alive = false;
          network.sendHit(playerID, bullet.damage);
        }
      });
    });

    // --- Render ---
    renderer.clear();
    renderer.drawMap(camera);
    renderer.drawBoundaries(boundaries, camera);
    renderer.drawNetworkPlayers(networkPlayers, camera, frameCount);
    if (!isDead) {
      renderer.drawPlayer(localPlayer, flip, camera, frameCount);
      renderer.drawGun(
        guns,
        playerPosition.x,
        playerPosition.y,
        mouseWorldX,
        mouseWorldY,
        flip,
        camera,
      );
    }
    renderer.drawCrosshair(mouse.x, mouse.y, flip);

    frameCount++;
    animFrameId = requestAnimationFrame(animation);
  }

  window.__stopGame = () => cancelAnimationFrame(animFrameId);

  animFrameId = requestAnimationFrame(animation);
}
