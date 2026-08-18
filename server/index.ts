import { randomUUID } from "crypto";
import { DurableObject } from "cloudflare:workers";

interface Player {
  x: number;
  y: number;
  playerNumber: number;
  health: number;
  ping: number;
}

interface Room {
  players: Map<string, Player>;
  usedNumbers: Set<number>;
  clients: Set<WebSocket>;
}

interface Env {}

// The map is a walled 20x15 tile maze (64px tiles). These four points sit in
// the open pockets tucked into each corner, clear of walls.
const SPAWN_POINTS: { x: number; y: number }[] = [
  { x: 100, y: 50 }, // top-left
  { x: 1100, y: 50 }, // top-right
  { x: 150, y: 800 }, // bottom-left
  { x: 1100, y: 800 }, // bottom-right
];

function spawnPointFor(playerNumber: number): { x: number; y: number } {
  return SPAWN_POINTS[playerNumber] ?? SPAWN_POINTS[0];
}

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
  pendingPings = new Map<WebSocket, number>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Server-authoritative latency check: ping every connected socket every
    // few seconds and broadcast the measured round-trip time to its room so
    // everyone can see everyone's ping.
    setInterval(() => this.pingAllClients(), 3000);
  }

  pingAllClients(): void {
    const now = Date.now();
    this.socketMeta.forEach((_meta, ws) => {
      if (ws.readyState === 1) {
        this.pendingPings.set(ws, now);
        try {
          ws.send(JSON.stringify({ type: "serverPing", t: now }));
        } catch {
          // socket went away between the readyState check and send; ignore
        }
      }
    });
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

    if (message.type === "pong") {
      const meta = this.socketMeta.get(ws);
      if (!meta) return;
      const sentAt = this.pendingPings.get(ws);
      if (sentAt === undefined) return;
      this.pendingPings.delete(ws);
      const rtt = Date.now() - sentAt;
      const room = this.rooms.get(meta.roomCode);
      if (!room) return;
      const player = room.players.get(meta.playerId);
      if (!player) return;
      player.ping = rtt;
      this.broadcastToRoom(meta.roomCode, {
        type: "ping",
        id: meta.playerId,
        playerNumber: player.playerNumber,
        ping: rtt,
      });
      return;
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
      const spawn = spawnPointFor(playerNumber);
      room.players.set(playerId, {
        x: spawn.x,
        y: spawn.y,
        playerNumber,
        health: 100,
        ping: 0,
      });
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
          position: { x: spawn.x, y: spawn.y },
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
          position: { x: spawn.x, y: spawn.y },
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
      // Dead players don't broadcast position — keeps them off everyone
      // else's screen until they respawn.
      if (player.health <= 0) return;
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
      const killer = room.players.get(meta.playerId);
      const targetPlayer = room.players.get(message.targetId);
      if (!targetPlayer) return;
      if (targetPlayer.health <= 0) return; // already dead, ignore stray hits
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
          victimNumber: targetPlayer.playerNumber,
          killerId: meta.playerId,
          killerNumber: killer?.playerNumber ?? null,
        });
      }
      return;
    }

    // --- Respawn ---
    if (message.type === "respawn") {
      const meta = this.socketMeta.get(ws);
      if (!meta) return;
      const room = this.rooms.get(meta.roomCode);
      if (!room) return;
      const player = room.players.get(meta.playerId);
      if (!player) return;

      // Only allow respawning if the player is actually dead
      if (player.health > 0) return;

      const spawn = spawnPointFor(player.playerNumber);
      player.health = 100;
      player.x = spawn.x;
      player.y = spawn.y;

      // Tell the respawning client where they are now
      ws.send(
        JSON.stringify({
          type: "respawned",
          position: { x: player.x, y: player.y },
          health: player.health,
        }),
      );

      // Let everyone else know this player is back in the fight
      this.broadcastToRoom(
        meta.roomCode,
        {
          type: "update",
          id: meta.playerId,
          playerNumber: player.playerNumber,
          position: { x: player.x, y: player.y },
        },
        ws,
      );
      return;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.pendingPings.delete(ws);
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
    this.pendingPings.delete(ws);
    this.socketMeta.delete(ws);
  }
}
