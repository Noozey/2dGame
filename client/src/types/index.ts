export type Screen = "menu" | "game" | "lobby";

export interface SoundSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  footstepsOn: boolean;
  gunshotOn: boolean;
}

declare global {
  interface Window {
    __gameSocket: WebSocket;
    __playerId: string;
    __playerNumber: number;
    __stopGame: () => void;
    __soundSettings: SoundSettings;
  }
}
