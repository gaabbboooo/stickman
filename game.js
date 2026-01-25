/* ==========================
   CONFIGURACIÓN GENERAL
========================== */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const groundY = () => canvas.height - 120;

let keys = {};
let phase = 1;
let isNight = false;
let lastPhaseChange = 0;

const gravity = 0.8;

/* ==========================
   CONTROLES
========================== */

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function bind(id, key) {
  const b = document.getElementById(id);
  b.addEventListener("touchstart", e => {
    e.preventDefault();
    keys[key] = true;
  });
  b.addEventListener("touchend", e => {
    e.preventDefault();
    keys[key] = false;
  });
}

bind("left", "ArrowLeft");
bind("right", "ArrowRight");
bind("jump", "ArrowUp");

/* ==========================
   STICKMAN
========================== */

class Player {
  constructor() {
    this.reset();
    this.maxXReached = 0;
    this.crossedFirstPit = false;
  }

  reset() {
    this.x = 60;
    this.y = groundY();
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
  }

  update() {
    if (keys["ArrowLeft"]) this.vx = -4;
    else if (keys["ArrowRight"]) this.vx = 4;
    else this.vx *= 0.8;

    if (keys["ArrowUp"] && this.onGround) {
      this.vy = -15;
      this.onGround = false;
    }

    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y >= groundY()) {
      this.y = groundY();
      this.vy = 0;
      this.onGround = true;
    }

    this.maxXReached = Math.max(this.maxXReached, this.x);
  }

  draw() {
    ctx.strokeStyle = isNight ? "white" : "black";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(this.x, this.y - 30, 8, 0, Math.PI * 2);
    ctx.moveTo(this.x, this.y - 22);
    ctx.lineTo(this.x, this.y);
    ctx.moveTo(this.x, this.y - 10);
    ctx.lineTo(this.x - 8, this.y - 20);
    ctx.moveTo(this.x, this.y - 10);
    ctx.lineTo(this.x + 8, this.y - 20);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - 6, this.y + 10);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + 6, this.y + 10);
    ctx.stroke();
  }
}

/* ==========================
   OBSTÁCULOS
========================== */

class Pit {
  constructor(x, w) {
    this.x = x;
    this.w = w;
  }

  draw() {
    ctx.clearRect(this.x, groundY(), this.w, 60);
  }

  kills(p) {
    if (p.onGround && p.x > this.x && p.x < this.x + this.w) {
      p.crossedFirstPit = true;
      return true;
    }
    return false;
  }
}

class Enemy {
  constructor(dir) {
    this.dir = dir;
    this.x = dir === -1 ? canvas.width + 60 : -60;
    this.speed = 2 + phase * 0.3;
  }

  update() {
    this.x += this.speed * this.dir;
  }

  draw() {
    ctx.strokeRect(this.x, groundY() - 30, 20, 30);
  }

  hits(p) {
    return p.onGround && Math.abs(p.x - this.x) < 15;
  }

  out() {
    return this.x < -100 || this.x > canvas.width + 100;
  }
}

class Tumbleweed {
  constructor(dir) {
    this.dir = dir;
    this.x = dir === -1 ? canvas.width + 80 : -80;
    this.speed = 3 + phase * 0.4;
  }

  update() {
    this.x += this.speed * this.dir;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, groundY() - 10, 18, 0, Math.PI * 2);
    ctx.stroke();
  }

  hits(p) {
    return p.onGround && Math.abs(p.x - this.x) < 18;
  }

  out() {
    return this.x < -120 || this.x > canvas.width + 120;
  }
}

/* ==========================
   JUEGO
========================== */

const player = new Player();
let pits = [];
let enemies = [];
let weeds = [];
let lastEnemySpawn = 0;
let lastWeedSpawn = 0;

const buildingX = () => canvas.width - 120;

function setupPhase() {
  pits = [];
  enemies = [];
  weeds = [];
  player.reset();

  pits.push(new Pit(300, 30));
  if (phase >= 2) pits.push(new Pit(600, 30));
}

setupPhase();

/* ==========================
   LOOP PRINCIPAL
========================== */

function loop(timestamp) {
  // Fondo
  ctx.fillStyle = isNight ? "#000" : "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = isNight ? "white" : "black";
  ctx.beginPath();
  ctx.moveTo(0, groundY());
  ctx.lineTo(canvas.width, groundY());
  ctx.stroke();

  // Edificio
  ctx.strokeRect(buildingX(), groundY() - 90, 70, 90);

  // Player
  player.update();
  player.draw();

  // Pozos
  pits.forEach(p => {
    p.draw();
    if (p.kills(player)) player.reset();
  });

  // Spawn enemigos
  if (phase >= 3 && timestamp - lastEnemySpawn > 2000) {
    const dir = player.crossedFirstPit ? (Math.random() < 0.5 ? -1 : 1) : -1;
    enemies.push(new Enemy(dir));
    lastEnemySpawn = timestamp;
  }

  // Spawn bola de paja
  if (phase >= 4 && timestamp - lastWeedSpawn > 10000) {
    const dir = player.crossedFirstPit ? (Math.random() < 0.5 ? -1 : 1) : -1;
    weeds.push(new Tumbleweed(dir));
    lastWeedSpawn = timestamp;
  }

  enemies = enemies.filter(e => {
    e.update();
    e.draw();
    if (e.hits(player)) player.reset();
    return !e.out();
  });

  weeds = weeds.filter(w => {
    w.update();
    w.draw();
    if (w.hits(player)) player.reset();
    return !w.out();
  });

  // Cambio de fase
  if (player.x > buildingX() && timestamp - lastPhaseChange > 500) {
    phase++;
    isNight = !isNight;
    lastPhaseChange = timestamp;
    setupPhase();
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
