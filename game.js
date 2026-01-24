// =======================
// CANVAS
// =======================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =======================
// RESIZE
// =======================
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// =======================
// TIEMPO
// =======================
let isNight = false;

// =======================
// JUGADOR
// =======================
const player = {
  x: 50,
  y: 0,
  w: 20,
  h: 35,
  vx: 0,       // velocidad horizontal
  vy: 0,       // velocidad vertical
  onGround: false
};

const SPEED = 4;   // velocidad horizontal
const JUMP = -12;
const gravity = 0.6;

// =======================
// MUNDO
// =======================
let pits = [];
let enemies = [];
let balls = []; // Bolas de paja
let goal = {};
let stage = 1; // Etapa inicial

// =======================
// CONTROLES FLUIDOS
// =======================
const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key] = false;
});

// =======================
// INICIALIZAR MUNDO
// =======================
function initWorld() {
  const groundY = canvas.height * 0.75;

  player.y = groundY - player.h;

  pits = [
    { x: canvas.width * 0.3, w: 80 },
    { x: canvas.width * 0.55, w: 80 }
  ];

  enemies = [
    { x: canvas.width * 0.4, y: groundY - 35, w: 20, h: 35, dir: 1 },
    { x: canvas.width * 0.65, y: groundY - 35, w: 20, h: 35, dir: -1 }
  ];

  goal = {
    x: canvas.width * 0.85,
    y: groundY - 60,
    w: 60,
    h: 60
  };

  balls = [];
}

initWorld();
window.addEventListener("resize", initWorld);

// =======================
// CREAR BOLA DE PAJA
// =======================
function spawnBall() {
  const groundY = canvas.height * 0.75;
  const fromLeft = Math.random() > 0.5;

  const speedBase = 2 + stage * 0.5;
  const size = 20 + Math.random() * 20;

  balls.push({
    x: fromLeft ? -size : canvas.width + size,
    y: groundY - Math.random() * 150 - 20,
    w: size,
    h: size,
    speed: fromLeft ? speedBase : -speedBase
  });
}

// =======================
// UPDATE
// =======================
let ballTimer = 0;
const BALL_INTERVAL_BASE = 10000; // 10s base

function update(delta) {
  const groundY = canvas.height * 0.75;

  // --- MOVIMIENTO HORIZONTAL FLUIDO ---
  player.vx = 0;
  if (keys["ArrowRight"]) player.vx = SPEED;
  if (keys["ArrowLeft"]) player.vx = -SPEED;
  player.x += player.vx;

  // --- SALTO ---
  if (keys["ArrowUp"] && player.onGround) {
    player.vy = JUMP;
    player.onGround = false;
  }

  // --- GRAVEDAD ---
  player.vy += gravity;
  player.y += player.vy;

  // --- POZOS ---
  const overPit = pits.some(p =>
    player.x + player.w > p.x &&
    player.x < p.x + p.w
  );

  if (!overPit && player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  if (player.y > canvas.height) respawn();

  // --- ENEMIGOS ---
  enemies.forEach(e => {
    e.x += e.dir * 1.2;
    if (e.x < canvas.width * 0.35 || e.x > canvas.width * 0.75) e.dir *= -1;
    if (collide(player, e)) respawn();
  });

  // --- BOLAS DE PAJA ---
  ballTimer += delta;
  const interval = BALL_INTERVAL_BASE / stage;
  if (ballTimer >= interval) {
    const maxBalls = stage;
    if (balls.length < maxBalls) spawnBall();
    ballTimer = 0;
  }

  balls.forEach((b, i) => {
    b.x += b.speed;
    if (collide(player, b)) respawn();
    if (b.x < -100 || b.x > canvas.width + 100) balls.splice(i, 1);
  });

  // --- TRABAJO ---
  if (collide(player, goal)) {
    isNight = !isNight;
    stage++;
    respawn();
  }
}

// =======================
// RESPAWN
// =======================
function respawn() {
  const groundY = canvas.height * 0.75;
  player.x = 50;
  player.y = groundY - player.h;
  player.vy = 0;
  player.onGround = false;
}

// =======================
// COLISIÓN
// =======================
function collide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// =======================
// STICKMAN
// =======================
function drawStickman(p, hostile = false) {
  const cx = p.x + p.w / 2;
  ctx.strokeStyle = hostile ? "red" : (isNight ? "white" : "black");
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, p.y - 8, 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, p.y);
  ctx.lineTo(cx, p.y + 15);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 10, p.y + 8);
  ctx.lineTo(cx + 10, p.y + 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, p.y + 15);
  ctx.lineTo(cx - 8, p.y + 35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, p.y + 15);
  ctx.lineTo(cx + 8, p.y + 35);
  ctx.stroke();
}

// =======================
// DRAW
// =======================
function draw() {
  ctx.fillStyle = isNight ? "black" : "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = isNight ? "white" : "black";
  ctx.lineWidth = 2;

  const groundY = canvas.height * 0.75;

  // Sol / luna
  ctx.beginPath();
  ctx.arc(100, 80, 20, 0, Math.PI * 2);
  ctx.stroke();

  // Piso con huecos
  let startX = 0;
  pits.forEach(p => {
    ctx.beginPath();
    ctx.moveTo(startX, groundY);
    ctx.lineTo(p.x, groundY);
    ctx.stroke();
    startX = p.x + p.w;
  });
  ctx.beginPath();
  ctx.moveTo(startX, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();

  // Pozos DELGADOS
  pits.forEach(p => {
    ctx.strokeRect(p.x, groundY, p.w, 2); // 2px de alto
  });

  // Bolas de paja
  balls.forEach(b => {
    ctx.beginPath();
    ctx.rect(b.x, b.y, b.w, b.h);
    ctx.stroke();
  });

  // Trabajo
  ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);

  // Enemigos
  enemies.forEach(e => drawStickman(e, true));

  // Jugador
  drawStickman(player);
}

// =======================
// LOOP
// =======================
let lastTime = 0;
function loop(time) {
  const delta = time - lastTime;
  lastTime = time;

  update(delta);
  draw();
  requestAnimationFrame(loop);
}

loop(0);
