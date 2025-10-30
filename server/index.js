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
  const playerId = randomUUID();
  console.log(`Player connected: ${playerId}`);
  players.set(playerId, { x: 300, y: 250 });

  // Send init message to the new player
  client.send(
    JSON.stringify({
      type: "init",
      id: playerId,
      position: players.get(playerId),
    }),
  );

  players.forEach((position, id) => {
    if (id !== playerId) {
      client.send(
        JSON.stringify({
          type: "update",
          id: id,
          position: position,
        }),
      );
    }
  });

  client.playerId = playerId;

  client.on("message", (data) => {
    const message = JSON.parse(data);
    if (message.type === "move") {
      players.set(playerId, message.position);
      broadcast(
        {
          type: "update",
          id: playerId,
          position: message.position,
        },
        client,
      );
    }
  });

  client.on("close", () => {
    console.log(`Player disconnected: ${playerId}`);
    // Broadcast disconnect BEFORE deleting from map
    broadcast({
      type: "disconnect",
      id: playerId,
    });
    players.delete(playerId);
  });
});
