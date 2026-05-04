import { Settings, Volume2, X } from "lucide-react";
import type { SoundSettings } from "../types";

interface SettingsModalProps {
  soundSettings: SoundSettings;
  onUpdateSetting: (key: string, value: number | boolean) => void;
  onClose: () => void;
}

export function SettingsModal({
  soundSettings,
  onUpdateSetting,
  onClose,
}: SettingsModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a0c10",
          border: "1px solid #1e3a2f",
          borderRadius: "4px",
          width: "460px",
          maxWidth: "95vw",
          overflow: "hidden",
          boxShadow:
            "0 0 60px rgba(0,255,128,0.05), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #1a2e22",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #0d1f15 0%, #0a0c10 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Settings size={14} color="#4ade80" />
            <span
              style={{
                color: "#e2e8f0",
                fontFamily: "'Courier New', monospace",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              System Settings
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#4a5568",
              padding: "4px",
              display: "flex",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Audio label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <Volume2 size={12} color="#4ade80" />
            <span
              style={{
                color: "#4ade80",
                fontFamily: "'Courier New', monospace",
                fontSize: "10px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
              }}
            >
              Audio Configuration
            </span>
          </div>

          {/* Volume sliders */}
          {(
            [
              { label: "Master Volume", key: "masterVolume" },
              { label: "Music Volume", key: "musicVolume" },
              { label: "SFX Volume", key: "sfxVolume" },
            ] as const
          ).map(({ label, key }) => (
            <div key={key} style={{ marginBottom: "22px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    color: "#94a3b8",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "11px",
                    letterSpacing: "0.05em",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    color: "#4ade80",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "11px",
                  }}
                >
                  {soundSettings[key]}%
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  height: "4px",
                  background: "#1a2e22",
                  borderRadius: "2px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${soundSettings[key]}%`,
                    background: "linear-gradient(90deg, #166534, #4ade80)",
                    borderRadius: "2px",
                    transition: "width 0.05s",
                    boxShadow: "0 0 6px rgba(74,222,128,0.3)",
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={soundSettings[key] as number}
                  onChange={(e) => onUpdateSetting(key, +e.target.value)}
                  style={{
                    position: "absolute",
                    inset: "-8px 0",
                    width: "100%",
                    opacity: 0,
                    cursor: "pointer",
                    margin: 0,
                  }}
                />
              </div>
            </div>
          ))}

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "#1a2e22",
              margin: "4px 0 20px",
            }}
          />

          {/* Toggles */}
          {(
            [
              { label: "Footstep Sounds", key: "footstepsOn" },
              { label: "Gunshot Sounds", key: "gunshotOn" },
            ] as const
          ).map(({ label, key }) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  color: "#94a3b8",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "11px",
                }}
              >
                {label}
              </span>
              <button
                onClick={() => onUpdateSetting(key, !soundSettings[key])}
                style={{
                  width: "44px",
                  height: "24px",
                  background: soundSettings[key] ? "#166534" : "#1a2030",
                  border: `1px solid ${soundSettings[key] ? "#4ade80" : "#2d3748"}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: soundSettings[key] ? "22px" : "2px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: soundSettings[key] ? "#4ade80" : "#4a5568",
                    transition: "left 0.2s",
                    boxShadow: soundSettings[key]
                      ? "0 0 6px rgba(74,222,128,0.5)"
                      : "none",
                  }}
                />
              </button>
            </div>
          ))}

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "12px",
              background: "linear-gradient(135deg, #166534, #14532d)",
              border: "1px solid #4ade80",
              borderRadius: "3px",
              cursor: "pointer",
              color: "#4ade80",
              fontFamily: "'Courier New', monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.opacity = "0.8")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.opacity = "1")
            }
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
