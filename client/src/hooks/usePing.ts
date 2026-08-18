import { useState, useEffect } from "react";

export function usePing() {
  const [ping, setPing] = useState(0);

  useEffect(() => {
    const handlePing = (e: CustomEvent<{ ping: number }>) =>
      setPing(e.detail.ping);
    window.addEventListener("pingUpdate", handlePing as EventListener);
    return () =>
      window.removeEventListener("pingUpdate", handlePing as EventListener);
  }, []);

  return ping;
}
