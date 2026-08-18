import { Skull } from "lucide-react";
import type { KillFeedEntry } from "../hooks/useKillFeed";

const PLAYER_COLORS = ["#4ade80", "#60a5fa", "#f472b6", "#fbbf24"];

function playerLabel(num: number | null | undefined) {
  if (num === null || num === undefined) return "UNKNOWN";
  return `PLAYER ${num + 1}`;
}

function playerColor(num: number | null | undefined) {
  if (num === null || num === undefined) return "#4a5568";
  return PLAYER_COLORS[num] ?? "#4a5568";
}

interface KillFeedProps {
  entries: KillFeedEntry[];
}

export function KillFeed({ entries }: KillFeedProps) {
  if (entries.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "230px",
        right: "16px",
        zIndex: 150,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        fontFamily: "'Courier New', monospace",
        pointerEvents: "none",
      }}
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 12px",
            background: "rgba(10,12,16,0.85)",
            border: "1px solid #1e3a2f",
            borderRadius: "3px",
            fontSize: "10px",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
            animation: "killFeedIn 0.2s ease",
          }}
        >
          <span style={{ color: playerColor(entry.killerNumber) }}>
            {playerLabel(entry.killerNumber)}
          </span>
          <Skull size={11} color="#ef4444" />
          <span style={{ color: playerColor(entry.victimNumber) }}>
            {playerLabel(entry.victimNumber)}
          </span>
        </div>
      ))}
      <style>{`
        @keyframes killFeedIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
