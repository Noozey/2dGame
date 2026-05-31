const gunfire = new Audio("./audio/gunfire.mp3");
const foots = new Audio("./audio/footsteps.mp3");
const bgaudio = new Audio("./audio/bg.mp3");

let canPlay = true;

function getSettings() {
  return (
    window.__soundSettings ?? {
      masterVolume: 80,
      musicVolume: 60,
      sfxVolume: 100,
      footstepsOn: true,
      gunshotOn: true,
    }
  );
}

function masterVol() {
  return getSettings().masterVolume / 100;
}
function musicVol() {
  return getSettings().musicVolume / 100;
}
function sfxVol() {
  return getSettings().sfxVolume / 100;
}

export function playGunfire() {
  const s = getSettings();
  if (!s.gunshotOn) return;
  if (!canPlay) return;

  canPlay = false;
  gunfire.volume = masterVol() * sfxVol() * 0.3; // 0.3 is your base gain
  gunfire.currentTime = 0;
  gunfire.play();
  setTimeout(() => (canPlay = true), 200);
}

foots.loop = true;

export function startFootsteps() {
  const s = getSettings();
  if (!s.footstepsOn) {
    stopFootsteps();
    return;
  }

  foots.volume = masterVol() * sfxVol() * 1.0;
  foots.play();
}

export function stopFootsteps() {
  foots.pause();
  foots.currentTime = 0;
}

bgaudio.loop = true;

export function backgroundAudio() {
  bgaudio.volume = masterVol() * musicVol() * 0.3;

  if (bgaudio.paused) {
    bgaudio.play().catch(() => {
      document.addEventListener("click", () => bgaudio.play(), { once: true });
    });
  } else {
    bgaudio.volume = masterVol() * musicVol() * 0.3;
  }
}

window.addEventListener("settingsChanged", () => {
  const s = getSettings();
  bgaudio.volume = masterVol() * musicVol() * 0.3;
  foots.volume = masterVol() * sfxVol() * 1.0;
  gunfire.volume = masterVol() * sfxVol() * 0.3;
  if (!s.footstepsOn) stopFootsteps();
});
