import { useState, useEffect, useRef, useCallback } from "react";

export interface KillFeedEntry {
  id: number;
  killerNumber: number | null;
  victimNumber: number;
}

interface KillFeedEventDetail {
  killerNumber: number | null;
  victimNumber: number;
  victimIsMe: boolean;
}

const ENTRY_LIFETIME_MS = 4500;
const MAX_ENTRIES = 5;

export function useKillFeed() {
  const [feed, setFeed] = useState<KillFeedEntry[]>([]);
  const [myKills, setMyKills] = useState(0);
  const [myDeaths, setMyDeaths] = useState(0);
  const nextId = useRef(0);

  useEffect(() => {
    const handleKill = (e: CustomEvent<KillFeedEventDetail>) => {
      const { killerNumber, victimNumber, victimIsMe } = e.detail;
      const id = nextId.current++;

      setFeed((prev) => [...prev.slice(-(MAX_ENTRIES - 1)), { id, killerNumber, victimNumber }]);
      setTimeout(() => {
        setFeed((prev) => prev.filter((entry) => entry.id !== id));
      }, ENTRY_LIFETIME_MS);

      if (victimIsMe) {
        setMyDeaths((d) => d + 1);
      } else if (killerNumber !== null && killerNumber === window.__playerNumber) {
        setMyKills((k) => k + 1);
      }
    };

    window.addEventListener("killFeedEvent", handleKill as EventListener);
    return () =>
      window.removeEventListener("killFeedEvent", handleKill as EventListener);
  }, []);

  // Used when leaving a match / starting a fresh one.
  const resetStats = useCallback(() => {
    setFeed([]);
    setMyKills(0);
    setMyDeaths(0);
  }, []);

  return { feed, myKills, myDeaths, resetStats };
}
