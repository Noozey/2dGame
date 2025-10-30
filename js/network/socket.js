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
        console.log("My player ID:", this.myPlayerId);
        break;

      case "update":
        if (message.id !== this.myPlayerId) {
          if (this.players.has(message.id)) {
            const playerData = this.players.get(message.id);
            playerData.x = message.position.x;
            playerData.y = message.position.y;
          } else {
            console.log("New player joined:", message.id);
            this.players.set(message.id, {
              x: message.position.x,
              y: message.position.y,
              sprite: this.createPlayerSprite(),
            });
          }
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

  createPlayerSprite() {
    const idleImg = new Image();
    idleImg.src = "./img/player1/idle.png";
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
