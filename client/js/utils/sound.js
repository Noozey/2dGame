const audio = new Audio("./audio/gunfire.mp3");
let canPlay = true;

export function playGunfire() {
  if (!canPlay) return;
  canPlay = false;
  audio.currentTime = 0;
  audio.play();
  setTimeout(() => (canPlay = true), 200);
}
