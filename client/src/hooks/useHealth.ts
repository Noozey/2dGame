import { useState, useEffect } from "react";

export function useHealth() {
  const [health, setHealth] = useState(100);

  useEffect(() => {
    const handleHealth = (e: CustomEvent) => setHealth(e.detail.health);
    window.addEventListener("healthUpdate", handleHealth as EventListener);
    return () =>
      window.removeEventListener("healthUpdate", handleHealth as EventListener);
  }, []);

  return { health };
}
