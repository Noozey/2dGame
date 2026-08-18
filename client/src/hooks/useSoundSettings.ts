import { useState, useEffect } from "react";
import type { SoundSettings } from "#/types";

const STORAGE_KEY = "soundSettings";

const defaultSettings: SoundSettings = {
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 100,
  footstepsOn: true,
  gunshotOn: true,
};

function loadSettings(): SoundSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    // Merge over defaults so new fields added later still get a sane value
    // even if the user's saved settings predate them.
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: SoundSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — settings
    // just won't persist across refreshes, which is fine as a fallback.
  }
}

export function useSoundSettings() {
  const [soundSettings, setSoundSettings] =
    useState<SoundSettings>(loadSettings);

  // Sync initial (possibly restored) settings to window on mount
  useEffect(() => {
    window.__soundSettings = soundSettings;
    window.dispatchEvent(new CustomEvent("settingsChanged"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateSetting(key: string, value: number | boolean) {
    setSoundSettings((prev) => {
      const next = { ...prev, [key]: value };
      window.__soundSettings = next;
      saveSettings(next);
      window.dispatchEvent(new CustomEvent("settingsChanged"));
      return next;
    });
  }

  return { soundSettings, updateSetting };
}
