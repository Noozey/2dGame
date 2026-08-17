import { useEffect } from "react";
import type { Screen } from "../types";

interface UseGameEventsOptions {
  screen: Screen;
  onGameOver: () => void;
  onGunSwitch: (gun: string) => void;
}

export function useGameEvents({
  screen,
  onGameOver,
  onGunSwitch,
}: UseGameEventsOptions) {
  // Game over → reset to menu
  useEffect(() => {
    window.addEventListener("gameOver", onGameOver);
    return () => window.removeEventListener("gameOver", onGameOver);
  }, [onGameOver]);

  // Gun switch via custom event (from canvas game logic)
  useEffect(() => {
    const handleGunSwitch = (e: CustomEvent) => onGunSwitch(e.detail.gun);
    window.addEventListener("gunSwitch", handleGunSwitch as EventListener);
    return () =>
      window.removeEventListener("gunSwitch", handleGunSwitch as EventListener);
  }, [onGunSwitch]);

  // Gun switch via keyboard keys 1 / 2 / 3
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (screen !== "game") return;
      if (e.key === "1") onGunSwitch("handgun");
      if (e.key === "2") onGunSwitch("shotgun");
      if (e.key === "3") onGunSwitch("machineGun");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [screen, onGunSwitch]);
}
