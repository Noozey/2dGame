import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

const players = new Map();
const ws = new WebSocketServer({ port: 3000 });

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
  const playerNumber = players.size; // 0 or 1

  players.set(playerId, { x: 300, y: 250, playerNumber });
  client.playerId = playerId;

  console.log(`Player connected: ${playerId} as #${playerNumber}`);

  // Send init to new player
  client.send(
    JSON.stringify({
      type: "init",
      id: playerId,
      playerNumber,
      position: { x: 300, y: 250 },
    }),
  );

  // Send all existing players to the new one
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

  // Notify others about the new player
  broadcast(
    {
      type: "update",
      id: playerId,
      playerNumber,
      position: { x: 300, y: 250 },
    },
    client,
  );

  // Movement updates
  client.on("message", (data) => {
    const message = JSON.parse(data);
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
    players.delete(playerId);

    broadcast({
      type: "disconnect",
      id: playerId,
    });

    if (players.size === 1) {
      const [remainingId, remainingData] = players.entries().next().value;
      remainingData.playerNumber = 0;

      ws.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({
              type: "renumber",
              id: remainingId,
              newPlayerNumber: 0,
            }),
          );
        }
      });
    }
  });
});
