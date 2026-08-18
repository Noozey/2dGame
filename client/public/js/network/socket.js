import { Sprite } from "../classes/Sprite.js";

export class NetworkManager {
  constructor(playerPosition) {
    this.socket = window.__gameSocket;
    this.players = new Map();
    this.myPlayerId = window.__playerId ?? null;
    this.myPlayerNumber = window.__playerNumber ?? 0;
    this.playerPosition = playerPosition;
    this.onHealthUpdate = null;

    // Lobby/scoreboard roster — one entry per connected player, keyed by
    // their playerId, kept in sync from server broadcasts.
    this.roster = new Map();

    this.initializeSocket();
    this.startPositionUpdates();
  }

  emitScoreboard() {
    const players = Array.from(this.roster.values()).sort(
      (a, b) => a.playerNumber - b.playerNumber,
    );
    window.dispatchEvent(
      new CustomEvent("scoreboardUpdate", { detail: { players } }),
    );
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

        this.roster.set(message.id, {
          playerId: message.id,
          playerNumber: message.playerNumber,
          alive: true,
          kills: 0,
          deaths: 0,
          ping: 0,
          isMe: true,
        });
        this.emitScoreboard();
        break;

      case "update":
        if (!this.roster.has(message.id)) {
          this.roster.set(message.id, {
            playerId: message.id,
            playerNumber: message.playerNumber,
            alive: true,
            kills: 0,
            deaths: 0,
            ping: 0,
            isMe: message.id === this.myPlayerId,
          });
        } else {
          const entry = this.roster.get(message.id);
          entry.playerNumber = message.playerNumber;
          // Dead players never send/broadcast "move", so simply receiving
          // an update for them proves they're back among the living.
          entry.alive = true;
        }
        this.emitScoreboard();

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

      case "dead": {
        const victimEntry = this.roster.get(message.id);
        if (victimEntry) {
          victimEntry.alive = false;
          victimEntry.deaths += 1;
        }
        if (message.killerId && message.killerId !== message.id) {
          const killerEntry = this.roster.get(message.killerId);
          if (killerEntry) killerEntry.kills += 1;
        }
        this.emitScoreboard();

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
      }

      case "respawned": {
        // Server confirming *our* respawn: snap back to the new spawn point
        this.playerPosition.x = message.position.x;
        this.playerPosition.y = message.position.y;
        window.dispatchEvent(
          new CustomEvent("healthUpdate", {
            detail: { health: message.health },
          }),
        );
        if (this.onHealthUpdate) this.onHealthUpdate(message.health);

        const myEntry = this.roster.get(this.myPlayerId);
        if (myEntry) myEntry.alive = true;
        this.emitScoreboard();

        window.dispatchEvent(new CustomEvent("localPlayerRespawned"));
        break;
      }

      case "disconnect":
        this.players.delete(message.id);
        this.roster.delete(message.id);
        this.emitScoreboard();
        break;

      case "serverPing":
        // The server is measuring round-trip time — bounce it straight back.
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: "pong", t: message.t }));
        }
        break;

      case "ping": {
        const entry = this.roster.get(message.id);
        if (entry) entry.ping = message.ping;
        this.emitScoreboard();

        if (message.id === this.myPlayerId) {
          window.dispatchEvent(
            new CustomEvent("pingUpdate", { detail: { ping: message.ping } }),
          );
        }
        break;
      }

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
