import { useState } from "react";
import {
  Settings,
  X,
  Wifi,
  Users,
  ChevronRight,
  Crosshair,
} from "lucide-react";

interface MenuScreenProps {
  onShowSettings: () => void;
  onGameStart: (
    roomCode: string,
    socket: WebSocket,
    id: string,
    playerNumber: number,
  ) => void;
}

export function MenuScreen({ onShowSettings, onGameStart }: MenuScreenProps) {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Each room is its own Durable Object on the server, addressed by room
  // code, so the socket has to be opened directly at that room's URL (the
  // Worker routes ?room=CODE to the right instance) — there's no more
  // "connect first, then ask for a room" round trip.
  function buildSocketUrl(roomCode: string) {
    const url = new URL(import.meta.env.VITE_WS_URL);
    url.searchParams.set("room", roomCode);
    return url.toString();
  }

  function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function connectAndSend(roomCode: string, payload: object) {
    setError("");
    setLoading(true);
    const socket = new WebSocket(buildSocketUrl(roomCode));

    socket.onopen = () => socket.send(JSON.stringify(payload));

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "error") {
        setError(msg.message);
        setLoading(false);
        socket.close();
        return;
      }

      if (msg.type === "init") {
        setLoading(false);
        onGameStart(msg.roomCode, socket, msg.id, msg.playerNumber);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("gameStart"));
        }, 100);
      }
    };

    socket.onerror = () => {
      setError("Connection failed. Is the server running?");
      setLoading(false);
    };
  }

  function handleCreate() {
    const roomCode = generateRoomCode();
    connectAndSend(roomCode, { type: "createRoom" });
  }

  function handleJoin() {
    if (inputCode.trim().length < 4) {
      setError("Enter a valid room code");
      return;
    }
    const roomCode = inputCode.trim().toUpperCase();
    connectAndSend(roomCode, { type: "joinRoom", roomCode });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050709",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Courier New', monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Settings button */}
      <button
        onClick={onShowSettings}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(10,12,16,0.8)",
          border: "1px solid #1e3a2f",
          borderRadius: "3px",
          padding: "10px",
          cursor: "pointer",
          color: "#4a5568",
          display: "flex",
          transition: "all 0.2s",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.color = "#4ade80";
          el.style.borderColor = "#4ade80";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.color = "#4a5568";
          el.style.borderColor = "#1e3a2f";
        }}
      >
        <Settings size={15} />
      </button>

      {/* Main panel */}
      <div
        style={{
          width: "400px",
          maxWidth: "95vw",
          border: "1px solid #1e3a2f",
          borderRadius: "4px",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Title */}
        <div
          style={{
            padding: "36px 32px 24px",
            borderBottom: "1px solid #1a2e22",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              marginBottom: "10px",
            }}
          >
            <Crosshair size={18} color="#4ade80" />
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                color: "#f0fdf4",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
              }}
            >
              COMBAT
            </h1>
            <Crosshair size={18} color="#4ade80" />
          </div>
          <p
            style={{
              margin: 0,
              color: "#2d5a3d",
              fontSize: "9px",
              letterSpacing: "0.3em",
            }}
          >
            TACTICAL MULTIPLAYER
          </p>
        </div>

        <div style={{ padding: "28px 32px 32px" }}>
          {/* Error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                marginBottom: "18px",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "3px",
                color: "#f87171",
                fontSize: "11px",
                letterSpacing: "0.04em",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <X size={11} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Tabs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              background: "#080a0d",
              border: "1px solid #1a2e22",
              borderRadius: "3px",
              padding: "3px",
              marginBottom: "24px",
            }}
          >
            {(["create", "join"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setError("");
                }}
                style={{
                  padding: "10px",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "2px",
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  transition: "all 0.15s",
                  background:
                    activeTab === tab
                      ? "linear-gradient(135deg, #166534, #14532d)"
                      : "transparent",
                  color: activeTab === tab ? "#4ade80" : "#4a5568",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {tab === "create" ? "Create Room" : "Join Room"}
              </button>
            ))}
          </div>

          {/* Create tab */}
          {activeTab === "create" && (
            <div>
              <div
                style={{
                  padding: "14px 16px",
                  marginBottom: "18px",
                  background: "rgba(22,101,52,0.05)",
                  border: "1px solid #1a2e22",
                  borderRadius: "3px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <Users size={12} color="#4ade80" />
                  <span
                    style={{
                      color: "#4ade80",
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                    }}
                  >
                    NEW ROOM
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "#4a5568",
                    fontSize: "11px",
                    lineHeight: "1.7",
                  }}
                >
                  Create a private room. Share the code with up to 3 teammates
                  to join your session.
                </p>
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: loading
                    ? "#0d1f15"
                    : "linear-gradient(135deg, #166534, #14532d)",
                  border: `1px solid ${loading ? "#1a2e22" : "#4ade80"}`,
                  borderRadius: "3px",
                  cursor: loading ? "not-allowed" : "pointer",
                  color: loading ? "#2d5a3d" : "#4ade80",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: "11px",
                        height: "11px",
                        border: "1px solid #2d5a3d",
                        borderTopColor: "#4ade80",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Establishing Link...
                  </>
                ) : (
                  <>
                    Create Room <ChevronRight size={13} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Join tab */}
          {activeTab === "join" && (
            <div>
              <label
                style={{
                  display: "block",
                  color: "#4a5568",
                  fontSize: "9px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Room Code
              </label>
              <input
                type="text"
                placeholder="XXXXXX"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setError("");
                }}
                maxLength={8}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#080a0d",
                  border: "1px solid #1a2e22",
                  borderRadius: "3px",
                  color: "#4ade80",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "22px",
                  letterSpacing: "0.45em",
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "12px",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#4ade80")}
                onBlur={(e) => (e.target.style.borderColor = "#1a2e22")}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <button
                onClick={handleJoin}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: loading
                    ? "#0d1f15"
                    : "linear-gradient(135deg, #166534, #14532d)",
                  border: `1px solid ${loading ? "#1a2e22" : "#4ade80"}`,
                  borderRadius: "3px",
                  cursor: loading ? "not-allowed" : "pointer",
                  color: loading ? "#2d5a3d" : "#4ade80",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: "11px",
                        height: "11px",
                        border: "1px solid #2d5a3d",
                        borderTopColor: "#4ade80",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Joining...
                  </>
                ) : (
                  <>
                    Join Room <ChevronRight size={13} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Status bar */}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
