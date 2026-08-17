import { useState, useEffect, useCallback } from "react";

export function useHealth() {
  const [health, setHealth] = useState(100);

  useEffect(() => {
    const handleHealth = (e: CustomEvent) => setHealth(e.detail.health);
    window.addEventListener("healthUpdate", handleHealth as EventListener);
    return () =>
      window.removeEventListener("healthUpdate", handleHealth as EventListener);
  }, []);

  // Death is derived directly from health, so respawning (which restores
  // health via a "healthUpdate" event) automatically clears it again.
  const death = health <= 0;

  // Used when starting a brand new match, so leftover state from a previous
  // game doesn't leak into the next one.
  const resetHealth = useCallback(() => setHealth(100), []);

  return { health, death, resetHealth };
}
