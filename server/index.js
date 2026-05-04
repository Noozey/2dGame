import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

const rooms = new Map();
const ws = new WebSocketServer({ port: 3000 });

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getNextPlayerNumber(room) {
  for (let i = 0; i < 4; i++) {
    if (!room.usedNumbers.has(i)) return i;
  }
  return -1;
}

function broadcastToRoom(roomCode, data, excludeClient = null) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const json = JSON.stringify(data);
  room.clients.forEach((client) => {
    if (client.readyState === 1 && client !== excludeClient) {
      client.send(json);
    }
  });
}

ws.on("connection", (client) => {
  console.log("New connection");

  client.on("message", (data) => {
    const message = JSON.parse(data);

    // --- Create Room ---
    if (message.type === "createRoom") {
      const roomCode = generateRoomCode();
      rooms.set(roomCode, {
        players: new Map(),
        usedNumbers: new Set(),
        clients: new Set(),
      });

      client.send(JSON.stringify({ type: "roomCreated", roomCode }));
      console.log(`Room created: ${roomCode}`);
      return;
    }

    // --- Join Room ---
    if (message.type === "joinRoom") {
      const roomCode = message.roomCode?.toUpperCase();
      const room = rooms.get(roomCode);

      if (!room) {
        client.send(
          JSON.stringify({ type: "error", message: "Room not found" }),
        );
        return;
      }

      if (room.players.size >= 4) {
        client.send(
          JSON.stringify({
            type: "error",
            message: "Room is full (max 4 players)",
          }),
        );
        return;
      }

      const playerId = randomUUID();
      const playerNumber = getNextPlayerNumber(room);
      room.usedNumbers.add(playerNumber);
      room.players.set(playerId, { x: 300, y: 250, playerNumber, health: 100 });
      room.clients.add(client);

      client.playerId = playerId;
      client.roomCode = roomCode;

      console.log(
        `Player ${playerId} joined room ${roomCode} as #${playerNumber}`,
      );

      // Send init to joining player
      client.send(
        JSON.stringify({
          type: "init",
          id: playerId,
          playerNumber,
          roomCode,
          position: { x: 300, y: 250 },
        }),
      );

      // Send existing players to joining player
      room.players.forEach((data, id) => {
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

      // Tell others about new player
      broadcastToRoom(
        roomCode,
        {
          type: "update",
          id: playerId,
          playerNumber,
          position: { x: 300, y: 250 },
        },
        client,
      );
      return;
    }

    // --- Move ---
    if (message.type === "move") {
      const roomCode = client.roomCode;
      const room = rooms.get(roomCode);
      if (!room) return;
      const player = room.players.get(client.playerId);
      if (!player) return;
      player.x = message.position.x;
      player.y = message.position.y;
      broadcastToRoom(
        roomCode,
        {
          type: "update",
          id: client.playerId,
          playerNumber: player.playerNumber,
          position: message.position,
        },
        client,
      );
      return;
    }

    // --- Hit ---
    if (message.type === "hit") {
      const roomCode = client.roomCode;
      const room = rooms.get(roomCode);
      if (!room) return;
      const targetPlayer = room.players.get(message.targetId);
      if (!targetPlayer) return;

      const damage = Math.min(message.damage ?? 10, 100); // ← clamp, never trust raw client value
      targetPlayer.health = Math.max(0, targetPlayer.health - damage);

      broadcastToRoom(roomCode, {
        type: "health",
        id: message.targetId,
        health: targetPlayer.health,
      });
      if (targetPlayer.health <= 0) {
        broadcastToRoom(roomCode, { type: "dead", id: message.targetId });
      }
      return;
    }
  });

  client.on("close", () => {
    const roomCode = client.roomCode;
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(client.playerId);
    if (player) room.usedNumbers.delete(player.playerNumber);
    room.players.delete(client.playerId);
    room.clients.delete(client);
    console.log(`Player ${client.playerId} left room ${roomCode}`);
    broadcastToRoom(roomCode, { type: "disconnect", id: client.playerId });

    // Clean up empty rooms
    if (room.players.size === 0) {
      rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted (empty)`);
    }
  });
});

console.log("Server running on port 3000");
