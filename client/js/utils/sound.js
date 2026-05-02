const gunfire = new Audio("./audio/gunfire.mp3");
const foots = new Audio("./audio/footsteps.mp3");
const bgaudio = new Audio("./audio/bg.mp3");

bgaudio.volume = 0.3;
foots.volume = 1;
gunfire.volume = 0.3;

let canPlay = true;

export function playGunfire() {
  if (!canPlay) return;
  canPlay = false;
  gunfire.currentTime = 0;
  gunfire.play();
  setTimeout(() => (canPlay = true), 200);
}

foots.loop = true;

export function startFootsteps() {
  foots.play();
}

export function stopFootsteps() {
  foots.pause();
  foots.currentTime = 0;
}

export function backgroundAudio() {
  bgaudio.play();
}
