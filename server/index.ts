import { randomUUID } from "crypto";
import { DurableObject } from "cloudflare:workers";

interface Player {
  x: number;
  y: number;
  playerNumber: number;
  health: number;
}

interface Room {
  players: Map<string, Player>;
  usedNumbers: Set<number>;
  clients: Set<WebSocket>;
}

interface Env {}

export default {
  async fetch(
    request: Request,
    env: Env & { WEBSOCKET_HANDLER: DurableObjectNamespace },
  ): Promise<Response> {
    const id = env.WEBSOCKET_HANDLER.idFromName("global");
    const stub = env.WEBSOCKET_HANDLER.get(id);
    return stub.fetch(request);
  },
};

export class WebSocketHandler extends DurableObject<Env> {
  rooms = new Map<string, Room>();
  socketMeta = new Map<WebSocket, { playerId: string; roomCode: string }>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  broadcastToRoom(
    roomCode: string,
    data: object,
    excludeClient: WebSocket | null = null,
  ): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const json = JSON.stringify(data);
    room.clients.forEach((client) => {
      if (client.readyState === 1 && client !== excludeClient) {
        client.send(json);
      }
    });
  }

  generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  getNextPlayerNumber(room: Room): number {
    for (let i = 0; i < 4; i++) {
      if (!room.usedNumbers.has(i)) return i;
    }
    return -1;
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket")
      return new Response("Expected WS", { status: 426 });

    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(
    ws: WebSocket,
    data: string | ArrayBuffer,
  ): Promise<void> {
    const message = JSON.parse(data as string);

    // --- Create Room ---
    if (message.type === "createRoom") {
      const roomCode = this.generateRoomCode();
      this.rooms.set(roomCode, {
        players: new Map(),
        usedNumbers: new Set(),
        clients: new Set(),
      });
      ws.send(JSON.stringify({ type: "roomCreated", roomCode }));
      console.log(`Room created: ${roomCode}`);
      return;
    }

    if (message.type === "ping") {
      ws.send("pong");
    }
    // --- Join Room ---
    if (message.type === "joinRoom") {
      const roomCode: string = message.roomCode?.toUpperCase();
      const room = this.rooms.get(roomCode);

      if (!room) {
        ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
        return;
      }

      if (room.players.size >= 4) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Room is full (max 4 players)",
          }),
        );
        return;
      }

      const playerId = randomUUID();
      const playerNumber = this.getNextPlayerNumber(room);
      room.usedNumbers.add(playerNumber);
      room.players.set(playerId, { x: 300, y: 250, playerNumber, health: 100 });
      room.clients.add(ws);
      this.socketMeta.set(ws, { playerId, roomCode });

      console.log(
        `Player ${playerId} joined room ${roomCode} as #${playerNumber}`,
      );

      ws.send(
        JSON.stringify({
          type: "init",
          id: playerId,
          playerNumber,
          roomCode,
          position: { x: 300, y: 250 },
        }),
      );

      room.players.forEach((playerData, id) => {
        if (id !== playerId) {
          ws.send(
            JSON.stringify({
              type: "update",
              id,
              playerNumber: playerData.playerNumber,
              position: playerData,
            }),
          );
        }
      });

      this.broadcastToRoom(
        roomCode,
        {
          type: "update",
          id: playerId,
          playerNumber,
          position: { x: 300, y: 250 },
        },
        ws,
      );
      return;
    }

    // --- Move ---
    if (message.type === "move") {
      const meta = this.socketMeta.get(ws);
      if (!meta) return;
      const room = this.rooms.get(meta.roomCode);
      if (!room) return;
      const player = room.players.get(meta.playerId);
      if (!player) return;
      player.x = message.position.x;
      player.y = message.position.y;
      this.broadcastToRoom(
        meta.roomCode,
        {
          type: "update",
          id: meta.playerId,
          playerNumber: player.playerNumber,
          position: message.position,
        },
        ws,
      );
      return;
    }

    // --- Hit ---
    if (message.type === "hit") {
      const meta = this.socketMeta.get(ws);
      if (!meta) return;
      const room = this.rooms.get(meta.roomCode);
      if (!room) return;
      const targetPlayer = room.players.get(message.targetId);
      if (!targetPlayer) return;
      const damage = Math.min(message.damage ?? 10, 100);
      targetPlayer.health = Math.max(0, targetPlayer.health - damage);
      this.broadcastToRoom(meta.roomCode, {
        type: "health",
        id: message.targetId,
        health: targetPlayer.health,
      });
      if (targetPlayer.health <= 0) {
        this.broadcastToRoom(meta.roomCode, {
          type: "dead",
          id: message.targetId,
        });
      }
      return;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const meta = this.socketMeta.get(ws);
    if (!meta) return;
    const { playerId, roomCode } = meta;
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(playerId);
    if (player) room.usedNumbers.delete(player.playerNumber);
    room.players.delete(playerId);
    room.clients.delete(ws);
    this.socketMeta.delete(ws);
    console.log(`Player ${playerId} left room ${roomCode}`);
    this.broadcastToRoom(roomCode, { type: "disconnect", id: playerId });
    if (room.players.size === 0) {
      this.rooms.delete(roomCode);
      console.log(`Room ${roomCode} deleted (empty)`);
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);
    this.socketMeta.delete(ws);
  }
}
