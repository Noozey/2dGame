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

// ─── Directional footsteps for opponents ───────────────────────────────────
// Uses the Web Audio API so each opponent's footsteps can be panned toward
// whichever side of the screen they're on, and quieted with distance —
// while your own footsteps (above) keep playing as a plain looped sound.

let audioCtx = null;
let footstepBuffer = null;
let footstepBufferPromise = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    // Browsers require a user gesture before audio can actually play.
    const resume = () => {
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    };
    document.addEventListener("click", resume);
    document.addEventListener("keydown", resume);
  }
  return audioCtx;
}

function loadFootstepBuffer() {
  if (footstepBuffer || footstepBufferPromise) return footstepBufferPromise;
  const ctx = getAudioCtx();
  if (!ctx) return null;
  footstepBufferPromise = fetch("./audio/footstep.mp3")
    .then((res) => res.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      footstepBuffer = buffer;
      return buffer;
    })
    .catch((err) => {
      console.error("Failed to load positional footstep audio:", err);
      return null;
    });
  return footstepBufferPromise;
}
loadFootstepBuffer();

const FOOTSTEP_MAX_DISTANCE = 700; // beyond this, an opponent is inaudible
const FOOTSTEP_PAN_RANGE = 400; // px of horizontal offset for full left/right pan
const FOOTSTEP_STEP_INTERVAL = 340; // ms between footstep sounds while moving

const footstepTimers = new Map();

function playPositionalFootstep(dx, distance) {
  const s = getSettings();
  if (!s.footstepsOn) return;
  if (!footstepBuffer) return; // still loading, skip this step
  if (distance > FOOTSTEP_MAX_DISTANCE) return;

  const ctx = getAudioCtx();
  if (!ctx || ctx.state === "suspended") return; // no user gesture yet

  const source = ctx.createBufferSource();
  source.buffer = footstepBuffer;

  const gainNode = ctx.createGain();
  const falloff = Math.max(0, 1 - distance / FOOTSTEP_MAX_DISTANCE);
  gainNode.gain.value = masterVol() * sfxVol() * 0.6 * falloff;

  if (ctx.createStereoPanner) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, dx / FOOTSTEP_PAN_RANGE));
    source.connect(panner).connect(gainNode).connect(ctx.destination);
  } else {
    source.connect(gainNode).connect(ctx.destination);
  }

  source.start(0);
}

/**
 * Call once per frame per opponent. Handles its own cadence timer so
 * footsteps play roughly every FOOTSTEP_STEP_INTERVAL ms while `isMoving`
 * is true, panned/attenuated using its position relative to the local
 * player (dx, dy).
 */
export function maybePlayOpponentFootstep(playerId, dx, dy, isMoving, now) {
  if (!isMoving) {
    footstepTimers.delete(playerId);
    return;
  }
  const last = footstepTimers.get(playerId) ?? 0;
  if (now - last < FOOTSTEP_STEP_INTERVAL) return;
  footstepTimers.set(playerId, now);

  const distance = Math.sqrt(dx * dx + dy * dy);
  playPositionalFootstep(dx, distance);
}
