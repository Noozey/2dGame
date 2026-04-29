import { Sprite } from "../classes/Sprite.js";

export class NetworkManager {
  constructor(playerPosition) {
    this.socket = new WebSocket("ws://localhost:3000");
    this.players = new Map();
    this.myPlayerId = null;
    this.playerPosition = playerPosition;
    this.initializeSocket();
    this.startPositionUpdates();
  }

  initializeSocket() {
    this.socket.addEventListener("open", () => {
      console.log("Connected to server");
    });

    this.socket.addEventListener("message", (event) => {
      this.handleMessage(JSON.parse(event.data));
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case "init":
        this.myPlayerId = message.id;
        this.playerPosition.x = message.position.x;
        this.playerPosition.y = message.position.y;
        this.myPlayerNumber = message.playerNumber;
        break;

      case "update":
        if (message.id !== this.myPlayerId) {
          if (this.players.has(message.id)) {
            const playerData = this.players.get(message.id);
            playerData.targetX = message.position.x;
            playerData.targetY = message.position.y;
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
        }
        break;

      case "dead":
        if (message.id === this.myPlayerId) {
          console.log("You died!");
        } else {
          console.log("Enemy died!");
        }
        break;

      case "disconnect":
        console.log("Player disconnected:", message.id);
        const deleted = this.players.delete(message.id);
        console.log("Player removed from map:", deleted);
        console.log("Remaining players:", this.players.size);
        break;
    }
  }

  sendHit(targetId) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "hit", targetId }));
    }
  }

  getMyPlayerNumber() {
    return this.myPlayerNumber ?? 0;
  }

  createPlayerSprite(playerNumber) {
    const idleImg = new Image();
    idleImg.src = `img/player${playerNumber + 1}/idle.png`;
    console.log(idleImg);
    return new Sprite(idleImg, 6);
  }

  startPositionUpdates() {
    setInterval(() => {
      if (this.socket.readyState === WebSocket.OPEN && this.myPlayerId) {
        this.socket.send(
          JSON.stringify({
            type: "move",
            position: this.playerPosition,
          }),
        );
      }
    }, 16);
  }

  getPlayers() {
    return this.players;
  }
}
