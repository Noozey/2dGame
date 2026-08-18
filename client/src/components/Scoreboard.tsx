import type { ScoreboardPlayer } from "../hooks/useScoreboard";

const PLAYER_COLORS = ["#4ade80", "#60a5fa", "#f472b6", "#fbbf24"];

interface ScoreboardProps {
  players: ScoreboardPlayer[];
}

export function Scoreboard({ players }: ScoreboardProps) {
  if (players.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 140,
        width: "216px",
        background: "rgba(10,12,16,0.88)",
        border: "1px solid #1e3a2f",
        borderRadius: "3px",
        fontFamily: "'Courier New', monospace",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "7px 12px",
          borderBottom: "1px solid #1e3a2f",
          color: "#2d5a3d",
          fontSize: "9px",
          letterSpacing: "0.2em",
        }}
      >
        LOBBY
      </div>

      {players.map((p) => {
        const color = PLAYER_COLORS[p.playerNumber] ?? "#4a5568";
        return (
          <div
            key={p.playerId}
            style={{
              padding: "7px 12px",
              borderBottom: "1px solid #14201a",
              background: p.isMe ? "rgba(74,222,128,0.06)" : "transparent",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  color,
                  fontSize: "10.5px",
                  letterSpacing: "0.04em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                PLAYER {p.playerNumber + 1}
                {p.isMe ? " · YOU" : ""}
              </span>
              <span
                style={{
                  fontSize: "8px",
                  letterSpacing: "0.1em",
                  padding: "2px 6px",
                  borderRadius: "2px",
                  flexShrink: 0,
                  color: p.alive ? "#4ade80" : "#ef4444",
                  border: `1px solid ${p.alive ? "#1e3a2f" : "#3a1e1e"}`,
                }}
              >
                {p.alive ? "ALIVE" : "DEAD"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "4px",
                paddingLeft: "15px",
                color: "#4a5568",
                fontSize: "9.5px",
                letterSpacing: "0.03em",
              }}
            >
              <span>K {p.kills}</span>
              <span>D {p.deaths}</span>
              <span style={{ marginLeft: "auto" }}>{p.ping}ms</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
