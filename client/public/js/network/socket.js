import { Sprite } from "../classes/Sprite.js";

export class NetworkManager {
  constructor(playerPosition) {
    this.socket = window.__gameSocket;
    this.players = new Map();
    this.myPlayerId = window.__playerId ?? null;
    this.myPlayerNumber = window.__playerNumber ?? 0;
    this.playerPosition = playerPosition;
    this.onHealthUpdate = null;

    this.initializeSocket();
    this.startPositionUpdates();
  }

  initializeSocket() {
    // Remove App.tsx's onmessage so it doesn't interfere
    this.socket.onmessage = null;

    this.socket.addEventListener("message", (event) => {
      this.handleMessage(JSON.parse(event.data));
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case "init":
        this.myPlayerId = message.id;
        this.myPlayerNumber = message.playerNumber;
        this.playerPosition.x = message.position.x;
        this.playerPosition.y = message.position.y;

        break;

      case "update":
        if (message.id === this.myPlayerId) break; // skip self

        if (this.players.has(message.id)) {
          const p = this.players.get(message.id);
          p.targetX = message.position.x;
          p.targetY = message.position.y;
          p.playerNumber = message.playerNumber;
        } else {
          this.players.set(message.id, {
            x: message.position.x,
            y: message.position.y,
            targetX: message.position.x,
            targetY: message.position.y,
            playerNumber: message.playerNumber,
            sprite: this.createPlayerSprite(message.playerNumber),
          });
        }
        break;

      case "health":
        if (!this.myPlayerId) break;
        if (message.id === this.myPlayerId) {
          window.dispatchEvent(
            new CustomEvent("healthUpdate", {
              detail: { health: message.health },
            }),
          );
          if (this.onHealthUpdate) this.onHealthUpdate(message.health);
        }
        break;

      case "dead":
        // Fire the kill-feed event for every death, not just our own, so
        // the feed shows the whole match's kills.
        window.dispatchEvent(
          new CustomEvent("killFeedEvent", {
            detail: {
              killerNumber:
                typeof message.killerNumber === "number"
                  ? message.killerNumber
                  : null,
              victimNumber: message.victimNumber,
              victimIsMe: message.id === this.myPlayerId,
            },
          }),
        );

        if (message.id === this.myPlayerId) {
          window.dispatchEvent(new CustomEvent("localPlayerDied"));
        } else {
          // Remove them from the world immediately — no ghost sprite
          // lingering until the next "update" comes in.
          this.players.delete(message.id);
        }
        break;

      case "respawned":
        // Server confirming *our* respawn: snap back to the new spawn point
        this.playerPosition.x = message.position.x;
        this.playerPosition.y = message.position.y;
        window.dispatchEvent(
          new CustomEvent("healthUpdate", {
            detail: { health: message.health },
          }),
        );
        if (this.onHealthUpdate) this.onHealthUpdate(message.health);
        window.dispatchEvent(new CustomEvent("localPlayerRespawned"));
        break;

      case "disconnect":
        this.players.delete(message.id);
        break;

      case "error":
        console.error("Server error:", message.message);
        break;
    }
  }

  sendHit(targetId, damage) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "hit", targetId, damage }));
    }
  }

  sendRespawn() {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "respawn" }));
    }
  }

  getMyPlayerNumber() {
    return this.myPlayerNumber ?? 0;
  }

  createPlayerSprite(playerNumber) {
    const idleImg = new Image();
    idleImg.src = `./img/player${playerNumber + 1}/idle.png`;
    idleImg.onload = () =>
      (idleImg.onerror = () =>
        console.error(`❌ Sprite failed: player${playerNumber + 1}`));
    return new Sprite(idleImg, 6);
  }

  startPositionUpdates() {
    setInterval(() => {
      if (this.socket.readyState === WebSocket.OPEN && this.myPlayerId) {
        this.socket.send(
          JSON.stringify({ type: "move", position: this.playerPosition }),
        );
      }
    }, 16);
  }

  getPlayers() {
    return this.players;
  }
}
