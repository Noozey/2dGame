import { useState, useEffect } from "react";

export interface ScoreboardPlayer {
  playerId: string;
  playerNumber: number;
  alive: boolean;
  kills: number;
  deaths: number;
  ping: number;
  isMe: boolean;
}

export function useScoreboard() {
  const [players, setPlayers] = useState<ScoreboardPlayer[]>([]);

  useEffect(() => {
    const handleUpdate = (e: CustomEvent<{ players: ScoreboardPlayer[] }>) =>
      setPlayers(e.detail.players);
    window.addEventListener("scoreboardUpdate", handleUpdate as EventListener);
    return () =>
      window.removeEventListener(
        "scoreboardUpdate",
        handleUpdate as EventListener,
      );
  }, []);

  return { players };
}
