import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

const players = new Map();
const usedNumbers = new Set();
const ws = new WebSocketServer({ port: 3000 });

function getNextPlayerNumber() {
  for (let i = 0; i < 2; i++) {
    if (!usedNumbers.has(i)) return i;
  }
  return -1;
}

function broadcast(data, excludeClient = null) {
  const json = JSON.stringify(data);
  ws.clients.forEach((client) => {
    if (client.readyState === 1 && client !== excludeClient) {
      client.send(json);
    }
  });
}

ws.on("connection", (client) => {
  if (players.size >= 2) {
    console.log("Server full, rejecting connection");
    client.send(
      JSON.stringify({
        type: "error",
        message: "Server is full (max 2 players)",
      }),
    );
    client.close();
    return;
  }

  const playerId = randomUUID();
  const playerNumber = getNextPlayerNumber();
  usedNumbers.add(playerNumber);
  players.set(playerId, { x: 300, y: 250, playerNumber, health: 100 });
  client.playerId = playerId;
  console.log(`Player connected: ${playerId} as #${playerNumber}`);

  client.send(
    JSON.stringify({
      type: "init",
      id: playerId,
      playerNumber,
      position: { x: 300, y: 250 },
    }),
  );

  players.forEach((data, id) => {
    if (id !== playerId) {
      client.send(
        JSON.stringify({
          type: "update",
          id,
          playerNumber: data.playerNumber,
          position: data,
        }),
      );
    }
  });

  broadcast(
    {
      type: "update",
      id: playerId,
      playerNumber,
      position: { x: 300, y: 250 },
    },
    client,
  );

  client.on("message", (data) => {
    const message = JSON.parse(data);

    if (message.type === "hit") {
      const targetPlayer = players.get(message.targetId);
      if (!targetPlayer) return;
      targetPlayer.health = Math.max(0, targetPlayer.health - 10);
      broadcast({
        type: "health",
        id: message.targetId,
        health: targetPlayer.health,
      });
      if (targetPlayer.health <= 0) {
        broadcast({ type: "dead", id: message.targetId });
      }
    }

    if (message.type === "move") {
      const player = players.get(playerId);
      if (!player) return;
      player.x = message.position.x;
      player.y = message.position.y;
      broadcast(
        {
          type: "update",
          id: playerId,
          playerNumber: player.playerNumber,
          position: message.position,
        },
        client,
      );
    }
  });

  client.on("close", () => {
    console.log(`Player disconnected: ${playerId}`);
    const player = players.get(playerId);
    if (player) usedNumbers.delete(player.playerNumber);
    players.delete(playerId);
    broadcast({
      type: "disconnect",
      id: playerId,
    });
  });
});
