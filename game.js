const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let keys = {};
let phase = 1;
let isNight = false;
let gravity = 0.8;

// Ajusta el canvas al tamaño de la ventana
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// Altura del suelo
const groundY = () => canvas.height - 120;

// Controles keyboard
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Controles táctiles
function bind(id, key) {
  const b = document.getElementById(id);
  b.addEventListener("touchstart", e => { e.preventDefault(); keys[key] = true; });
  b.addEventListener("touchend", e => { e.preventDefault(); keys[key] = false; });
}
bind("leftBtn", "ArrowLeft");
bind("rightBtn", "ArrowRight");
bind("jumpBtn", "ArrowUp");

// Stickman
class Stickman {
  constructor() { this.reset(); }

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

// Pozo
class Pit {
  constructor(x, w) {
    this.x = x;
    this.w = w;
  }

  draw() {
    ctx.clearRect(this.x, groundY(), this.w, 60);
  }

  kills(p) {
    return p.onGround && p.x > this.x && p.x < this.x + this.w;
  }
}

// Enemigos
class Enemy {
  constructor(x) {
    this.x = x;
    this.dir = Math.random() < 0.5 ? -1 : 1;
  }

  update() {
    this.x += this.dir * 2;
    if (this.x < 0 || this.x > canvas.width) this.dir *= -1;
  }

  draw() {
    ctx.strokeRect(this.x, groundY() - 30, 20, 30);
  }

  hits(p) {
    return p.onGround && Math.abs(p.x - this.x) < 15;
  }
}

// Bola de paja
class Tumbleweed {
  constructor() {
    this.x = -40;
    this.speed = 4;
  }

  update() {
    this.x += this.speed;
    if (this.x > canvas.width + 40) this.x = -40;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, groundY() - 10, 20, 0, Math.PI * 2);
    ctx.stroke();
  }

  hits(p) {
    return p.onGround && Math.abs(p.x - this.x) < 20;
  }
}

// Variables del juego
let player = new Stickman();
let pits = [];
let enemies = [];
let weeds = [];
const buildingX = () => canvas.width - 140;

// Configuración de fases
function setupPhase() {
  pits = [];
  enemies = [];
  weeds = [];

  // Pozos
  pits.push(new Pit(300, 30));
  if (phase >= 2) pits.push(new Pit(600, 30));

  // Enemigos
  if (phase >= 3) enemies.push(new Enemy(400));
  if (phase >= 5) enemies.push(new Enemy(700));

  // Bolas de paja
  if (phase >= 4) weeds.push(new Tumbleweed());
}
setupPhase();

// Cambiar de fase
function nextPhase() {
  phase++;
  isNight = !isNight;
  player.reset();
  setupPhase();
}

// Dibujar mundo
function drawWorld() {
  ctx.fillStyle = isNight ? "#000" : "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = isNight ? "white" : "black";
  ctx.beginPath();
  ctx.moveTo(0, groundY());
  ctx.lineTo(canvas.width, groundY());
  ctx.stroke();

  pits.forEach(p => p.draw());
  enemies.forEach(e => e.draw());
  weeds.forEach(w => w.draw());

  // Edificio al final
  ctx.strokeRect(buildingX(), groundY() - 90, 70, 90);
}

// Loop principal
function loop() {
  drawWorld();

  player.update();
  player.draw();

  pits.forEach(p => { if (p.kills(player)) player.reset(); });
  enemies.forEach(e => {
    e.update();
    if (e.hits(player)) player.reset();
  });
  weeds.forEach(w => {
    e.update();
    if (w.hits(player)) player.reset();
  });

  if (player.x > buildingX()) nextPhase();

  requestAnimationFrame(loop);
}

loop();
