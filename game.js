const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let keys = {};
let stage = 1;
let isNight = false;
let gravity = 0.7;

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Botones táctiles
const bindButton = (id, key) => {
  const btn = document.getElementById(id);
  btn.addEventListener("touchstart", e => { e.preventDefault(); keys[key] = true; });
  btn.addEventListener("touchend", e => { e.preventDefault(); keys[key] = false; });
};

bindButton("leftBtn", "ArrowLeft");
bindButton("rightBtn", "ArrowRight");
bindButton("jumpBtn", "ArrowUp");

class Stickman {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 50;
    this.y = groundY;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
  }

  update() {
    if (keys["ArrowLeft"]) this.vx = -4;
    else if (keys["ArrowRight"]) this.vx = 4;
    else this.vx *= 0.8;

    if (keys["ArrowUp"] && this.onGround) {
      this.vy = -14;
      this.onGround = false;
    }

    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.onGround = true;
    }
  }

  draw() {
    ctx.strokeStyle = isNight ? "white" : "black";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(this.x, this.y - 30, 8, 0, Math.PI * 2); // cabeza
    ctx.moveTo(this.x, this.y - 22);
    ctx.lineTo(this.x, this.y); // cuerpo
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

class Pit {
  constructor(x, width) {
    this.x = x;
    this.width = width;
  }

  draw() {
    ctx.clearRect(this.x, groundY, this.width, 40);
  }

  kill(player) {
    return player.x > this.x && player.x < this.x + this.width;
  }
}

class Tumbleweed {
  constructor(speed) {
    this.x = Math.random() < 0.5 ? -50 : canvas.width + 50;
    this.y = groundY;
    this.speed = speed * (this.x < 0 ? 1 : -1);
    this.size = 20;
  }

  update() {
    this.x += this.speed;
  }

  draw() {
    ctx.strokeStyle = isNight ? "white" : "black";
    ctx.beginPath();
    ctx.arc(this.x, this.y - 10, this.size, 0, Math.PI * 2);
    ctx.stroke();
  }

  hit(player) {
    return Math.abs(player.x - this.x) < this.size;
  }
}

let groundY = canvas.height - 100;
let player = new Stickman();
let pits = [];
let weeds = [];
let buildingX = canvas.width - 120;

function setupStage() {
  pits = [];
  weeds = [];

  let pitCount = Math.min(1 + stage, 6);
  let weedCount = Math.min(stage, 8);

  for (let i = 0; i < pitCount; i++) {
    pits.push(new Pit(300 + i * 250, 30));
  }

  for (let i = 0; i < weedCount; i++) {
    weeds.push(new Tumbleweed(2 + stage * 0.4));
  }
}

setupStage();

function die() {
  player.reset();
}

function nextStage() {
  stage++;
  isNight = !isNight;
  player.reset();
  setupStage();
}

function drawWorld() {
  ctx.fillStyle = isNight ? "black" : "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = isNight ? "white" : "black";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();

  pits.forEach(p => p.draw());

  ctx.strokeRect(buildingX, groundY - 80, 60, 80);
}

function loop() {
  drawWorld();

  player.update();
  player.draw();

  pits.forEach(p => {
    if (p.kill(player)) die();
  });

  weeds.forEach(w => {
    w.update();
    w.draw();
    if (w.hit(player)) die();
  });

  if (player.x > buildingX) nextStage();

  requestAnimationFrame(loop);
}

loop();
