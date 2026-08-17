import { useCallback, useState } from "react";
import type { Screen } from "./types";
import { useHealth } from "./hooks/useHealth";
import { useSoundSettings } from "./hooks/useSoundSettings";
import { useGameEvents } from "./hooks/useGameEvents";
import { useKillFeed } from "./hooks/useKillFeed";
import { SettingsModal } from "./components/SettingsModal";
import { MenuScreen } from "./components/MenuScreen";
import { GameHUD } from "./components/GameHUD";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [roomCode, setRoomCode] = useState("");
  const [currentGun, setCurrentGun] = useState("handgun");
  const [showSettings, setShowSettings] = useState(false);

  const { health, death, resetHealth } = useHealth();
  const { soundSettings, updateSetting } = useSoundSettings();
  const { feed, myKills, myDeaths, resetStats } = useKillFeed();

  // Connection drops (or a deliberate "leave match") send us back to the menu.
  const handleGameOver = useCallback(() => {
    setScreen("menu");
    setRoomCode("");
    resetHealth();
    resetStats();
  }, [resetHealth, resetStats]);

  const handleGunSwitch = useCallback((gun: string) => {
    setCurrentGun(gun);
  }, []);

  useGameEvents({
    screen,
    onGameOver: handleGameOver,
    onGunSwitch: handleGunSwitch,
  });

  function handleGameStart(
    code: string,
    socket: WebSocket,
    id: string,
    playerNumber: number,
  ) {
    window.__gameSocket = socket;
    window.__playerId = id;
    window.__playerNumber = playerNumber;
    resetHealth();
    resetStats();
    setRoomCode(code);
    setCurrentGun("handgun");
    setScreen("game");
  }

  // Player chose "Respawn" on the death screen — ask the game loop to tell
  // the server, it'll come back to life at the spawn point.
  const handleRespawn = useCallback(() => {
    window.dispatchEvent(new CustomEvent("requestRespawn"));
  }, []);

  // Player chose "Leave Match" on the death screen — close the socket, which
  // triggers the existing disconnect handling (stops the game, fires
  // "gameOver", and we land back on the menu above).
  const handleLeaveMatch = useCallback(() => {
    window.__gameSocket?.close();
  }, []);

  return (
    <div style={{ position: "relative", background: "#050709" }}>
      {screen === "menu" ? (
        <MenuScreen
          onShowSettings={() => setShowSettings(true)}
          onGameStart={handleGameStart}
        />
      ) : (
        <GameHUD
          health={health}
          roomCode={roomCode}
          currentGun={currentGun}
          death={death}
          killFeed={feed}
          myKills={myKills}
          myDeaths={myDeaths}
          onShowSettings={() => setShowSettings(true)}
          onRespawn={handleRespawn}
          onLeaveMatch={handleLeaveMatch}
        />
      )}

      {showSettings && (
        <SettingsModal
          soundSettings={soundSettings}
          onUpdateSetting={updateSetting}
          onClose={() => setShowSettings(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
