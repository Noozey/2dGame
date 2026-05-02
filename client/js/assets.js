const load = (src) => {
  const img = new Image();
  img.src = src;
  return img;
};

export const assets = {
  player1Idle: load("./img/player1/idle.png"),
  player1Walking: load("./img/player1/walking.png"),
  player2Idle: load("./img/player2/idle.png"),
  player2Walking: load("./img/player2/walking.png"),
  gun: load("./img/weapon.png"),
  crosshair: load("./img/crosshair.png"),
  shoot: load("./img/muzzle.png"),
  map: load("./img/map.png"),
  handgun: load("./img/handgun.png"),
  shotgun: load("./img/shotgun.png"),
  machineGun: load("./img/machineGun.png"),
  bullet: load("./img/bullet.png"),
};
