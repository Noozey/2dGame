import { useCallback, useState } from "react";
import type { Screen } from "./types";
import { useHealth } from "./hooks/useHealth";
import { useSoundSettings } from "./hooks/useSoundSettings";
import { useGameEvents } from "./hooks/useGameEvents";
import { SettingsModal } from "./components/SettingsModal";
import { MenuScreen } from "./components/MenuScreen";
import { GameHUD } from "./components/GameHUD";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [roomCode, setRoomCode] = useState("");
  const [currentGun, setCurrentGun] = useState("handgun");
  const [showSettings, setShowSettings] = useState(false);

  const { health } = useHealth();
  const { soundSettings, updateSetting } = useSoundSettings();

  const handleGameOver = useCallback(() => {
    setScreen("menu");
    setRoomCode("");
  }, []);

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
    setRoomCode(code);
    setCurrentGun("handgun");
    setScreen("game");
  }

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
          onShowSettings={() => setShowSettings(true)}
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
