import { useState, useEffect } from "react";
import type { SoundSettings } from "#/types";

const defaultSettings: SoundSettings = {
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 100,
  footstepsOn: true,
  gunshotOn: true,
};

export function useSoundSettings() {
  const [soundSettings, setSoundSettings] =
    useState<SoundSettings>(defaultSettings);

  // Sync initial settings to window on mount
  useEffect(() => {
    window.__soundSettings = defaultSettings;
  }, []);

  function updateSetting(key: string, value: number | boolean) {
    setSoundSettings((prev) => {
      const next = { ...prev, [key]: value };
      window.__soundSettings = next;
      window.dispatchEvent(new CustomEvent("settingsChanged"));
      return next;
    });
  }

  return { soundSettings, updateSetting };
}
