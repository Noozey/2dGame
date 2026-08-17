import { Skull, RotateCcw, LogOut } from "lucide-react";

interface DeathScreenProps {
  onRespawn: () => void;
  onLeaveMatch: () => void;
}

export function DeathScreen({ onRespawn, onLeaveMatch }: DeathScreenProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "22px",
        background: "rgba(5,7,9,0.82)",
        backdropFilter: "blur(4px)",
        fontFamily: "'Courier New', monospace",
        animation: "fadeIn 0.25s ease",
      }}
    >
      <Skull size={42} color="#ef4444" />

      <h1
        style={{
          margin: 0,
          fontSize: "28px",
          fontWeight: 700,
          color: "#f0fdf4",
          letterSpacing: "0.35em",
          textTransform: "uppercase",
        }}
      >
        You Died
      </h1>

      <p
        style={{
          margin: 0,
          color: "#4a5568",
          fontSize: "11px",
          letterSpacing: "0.12em",
          textAlign: "center",
        }}
      >
        Respawn to jump back into the fight, or return to the menu.
      </p>

      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          onClick={onRespawn}
          style={{
            padding: "14px 22px",
            background: "linear-gradient(135deg, #166534, #14532d)",
            border: "1px solid #4ade80",
            borderRadius: "3px",
            cursor: "pointer",
            color: "#4ade80",
            fontFamily: "'Courier New', monospace",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
        >
          <RotateCcw size={13} />
          Respawn
        </button>

        <button
          onClick={onLeaveMatch}
          style={{
            padding: "14px 22px",
            background: "rgba(10,12,16,0.9)",
            border: "1px solid #1e3a2f",
            borderRadius: "3px",
            cursor: "pointer",
            color: "#4a5568",
            fontFamily: "'Courier New', monospace",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.color = "#ef4444";
            el.style.borderColor = "#ef4444";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.color = "#4a5568";
            el.style.borderColor = "#1e3a2f";
          }}
        >
          <LogOut size={13} />
          Leave Match
        </button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}
