import { Heart, Settings, Shield, Wifi, Crosshair, Skull as SkullIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { DeathScreen } from "./DeathScreen";
import { KillFeed } from "./KillFeed";
import { Scoreboard } from "./Scoreboard";
import { usePing } from "../hooks/usePing";
import { useScoreboard } from "../hooks/useScoreboard";
import type { KillFeedEntry } from "../hooks/useKillFeed";

interface GameHUDProps {
  health: number;
  roomCode: string;
  currentGun: string;
  death: boolean;
  killFeed: KillFeedEntry[];
  myKills: number;
  myDeaths: number;
  onShowSettings: () => void;
  onRespawn: () => void;
  onLeaveMatch: () => void;
}

const GUNS = [
  { key: "handgun", label: "PISTOL", num: "1" },
  { key: "shotgun", label: "SHOTGUN", num: "2" },
  { key: "machineGun", label: "M. GUN", num: "3" },
] as const;

const TOTAL_HEARTS = 10;

export function GameHUD({
  health,
  roomCode,
  currentGun,
  death,
  killFeed,
  myKills,
  myDeaths,
  onShowSettings,
  onRespawn,
  onLeaveMatch,
}: GameHUDProps) {
  const filledHearts = Math.ceil(health / 10);
  const healthColor =
    health > 50 ? "#4ade80" : health > 25 ? "#fbbf24" : "#ef4444";

  const [copied, setCopied] = useState(false);
  const ping = usePing();
  const { players } = useScoreboard();

  useEffect(() => {
    navigator.clipboard
      .writeText(roomCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <canvas id="canvas" style={{ display: "block" }} />

      {/* Top HUD bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "12px 20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background:
            "linear-gradient(180deg, rgba(5,7,9,0.92) 0%, transparent 100%)",
          fontFamily: "'Courier New', monospace",
          pointerEvents: "none",
        }}
      >
        {/* Health block */}
        <div style={{ pointerEvents: "all" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "5px",
            }}
          >
            <Shield size={10} color="#4ade80" />
            <span
              style={{
                color: "#2d5a3d",
                fontSize: "9px",
                letterSpacing: "0.2em",
              }}
            >
              HEALTH
            </span>
            <span
              style={{
                color: healthColor,
                fontSize: "9px",
                marginLeft: "2px",
                transition: "color 0.3s",
              }}
            >
              {health}%
            </span>
          </div>

          {/* Hearts row */}
          <div style={{ display: "flex", gap: "3px", marginBottom: "5px" }}>
            {Array.from({ length: TOTAL_HEARTS }).map((_, i) => (
              <Heart
                key={i}
                size={14}
                color={i < filledHearts ? "#ef4444" : "#1a2030"}
                fill={i < filledHearts ? "#ef4444" : "#1a2030"}
                style={{
                  transition: "all 0.3s",
                  filter:
                    i < filledHearts
                      ? "drop-shadow(0 0 3px rgba(239,68,68,0.6))"
                      : "none",
                }}
              />
            ))}
          </div>

          {/* Health bar */}
          <div
            style={{
              width: "140px",
              height: "2px",
              background: "#1a2030",
              borderRadius: "1px",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "1px",
                width: `${health}%`,
                background: healthColor,
                transition: "width 0.4s ease, background 0.4s",
                boxShadow: `0 0 8px ${
                  health > 50
                    ? "rgba(74,222,128,0.5)"
                    : health > 25
                      ? "rgba(251,191,36,0.5)"
                      : "rgba(239,68,68,0.5)"
                }`,
              }}
            />
          </div>
        </div>

        {/* Room code badge */}
        <div
          style={{
            padding: "7px 14px",
            background: "rgba(10,12,16,0.9)",
            border: "1px solid #1e3a2f",
            borderRadius: "3px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Wifi size={9} color="#4ade80" />
            <span
              style={{
                color: "#2d5a3d",
                fontSize: "9px",
                letterSpacing: "0.12em",
              }}
            >
              ROOM
            </span>
            <span
              style={{
                color: "#4ade80",
                fontSize: "13px",
                letterSpacing: "0.35em",
              }}
            >
              {roomCode}
            </span>
            {copied && (
              <span style={{ color: "#4ade80", fontSize: "11px" }}>
                copied!
              </span>
            )}
          </div>

          <div
            style={{
              width: "1px",
              height: "14px",
              background: "#1e3a2f",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Crosshair size={10} color="#4ade80" />
            <span style={{ color: "#4ade80", fontSize: "11px" }}>
              {myKills}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <SkullIcon size={10} color="#ef4444" />
            <span style={{ color: "#ef4444", fontSize: "11px" }}>
              {myDeaths}
            </span>
          </div>

          <div
            style={{
              width: "1px",
              height: "14px",
              background: "#1e3a2f",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Wifi
              size={10}
              color={ping < 80 ? "#4ade80" : ping < 160 ? "#fbbf24" : "#ef4444"}
            />
            <span
              style={{
                color: ping < 80 ? "#4ade80" : ping < 160 ? "#fbbf24" : "#ef4444",
                fontSize: "11px",
              }}
            >
              {ping}ms
            </span>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={onShowSettings}
          style={{
            background: "rgba(10,12,16,0.9)",
            border: "1px solid #1e3a2f",
            borderRadius: "3px",
            padding: "8px",
            cursor: "pointer",
            color: "#4a5568",
            display: "flex",
            transition: "all 0.2s",
            pointerEvents: "all",
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
          <Settings size={14} />
        </button>
      </div>

      {/* Bottom gun selector */}
      <div
        style={{
          position: "fixed",
          bottom: "18px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "5px",
          zIndex: 100,
          fontFamily: "'Courier New', monospace",
        }}
      >
        {GUNS.map(({ key, label, num }) => {
          const active = currentGun === key;
          return (
            <div
              key={key}
              style={{
                padding: "8px 16px",
                textAlign: "center",
                background: active
                  ? "rgba(22,101,52,0.35)"
                  : "rgba(10,12,16,0.85)",
                border: `1px solid ${active ? "#4ade80" : "#1e3a2f"}`,
                borderRadius: "3px",
                boxShadow: active ? "0 0 14px rgba(74,222,128,0.12)" : "none",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  color: "#2d5a3d",
                  fontSize: "8px",
                  marginBottom: "3px",
                }}
              >
                [{num}]
              </div>
              <div
                style={{
                  color: active ? "#4ade80" : "#4a5568",
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  transition: "color 0.2s",
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <Scoreboard players={players} />
      <KillFeed entries={killFeed} />

      {death && (
        <DeathScreen onRespawn={onRespawn} onLeaveMatch={onLeaveMatch} />
      )}
    </>
  );
}
