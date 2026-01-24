// =======================
// CANVAS
// =======================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =======================
// ESTADO GLOBAL
// =======================
let isNight = false;
let pits = [];
let enemies = [];
let goal = {};
let stage = 1;

// =======================
// JUGADOR
// =======================
const player = {
  x: 50,
  y: 0,
  w: 20,
  h: 35,
  vx: 0,
  vy: 0,
  onGround: false
};

const SPEED = 4;
const JUMP = -12;
const gravity = 0.6;

// =======================
// INPUT
// =======================
const keys = { left: false, right: false, up: false };

window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === "ArrowUp") keys.up = true;
});
window.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === "ArrowUp") keys.up = false;
});

// =======================
// BOTONES TÁCTILES
// =======================
const buttons = {
  left: { x: 0, y: 0, w: 80, h: 80 },
  right: { x: 0, y: 0, w: 80, h: 80 },
  up: { x: 0, y: 0, w: 80, h: 80 }
};

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  for (let t of e.touches) handleTouch(t.clientX, t.clientY, true);
});
canvas.addEventListener("touchend", () => {
  keys.left = keys.right = keys.up = false;
});

function handleTouch(x, y, down) {
  for (let k in buttons) {
    const b = buttons[k];
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) {
      keys[k] = down;
    }
  }
}

// =======================
// RESIZE + INIT
// =======================
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  positionButtons();
  initWorld();
}
window.addEventListener("resize", resize);
resize();

// =======================
// MUNDO
// =======================
function initWorld() {
  const groundY = canvas.height * 0.75;

  player.x = 50;
  player.y = groundY - player.h;
  player.vy = 0;

  pits = [
    { x: canvas.width * 0.3, w: 80 },
    { x: canvas.width * 0.55, w: 80 }
  ];

  enemies = [
    { x: canvas.width * 0.45, y: groundY - 35, w: 20, h: 35, dir: 1 }
  ];

  goal = {
    x: canvas.width * 0.85,
    y: groundY - 60,
    w: 60,
    h: 60
  };
}

// =======================
// BOTONES POSICIÓN
// =======================
function positionButtons() {
  const margin = 20;
  const bottom = canvas.height - 100;

  buttons.left.x = margin;
  buttons.left.y = bottom;

  buttons.right.x = margin + 100;
  buttons.right.y = bottom;

  buttons.up.x = canvas.width - 100;
  buttons.up.y = bottom;
}

// =======================
// UPDATE
// =======================
function update() {
  const groundY = canvas.height * 0.75;

  player.vx = 0;
  if (keys.left) player.vx = -SPEED;
  if (keys.right) player.vx = SPEED;

  player.x += player.vx;

  if (keys.up && player.onGround) {
    player.vy = JUMP;
    player.onGround = false;
  }

  player.vy += gravity;
  player.y += player.vy;

  const overPit = pits.some(p =>
    player.x + player.w > p.x && player.x < p.x + p.w
  );

  if (!overPit && player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  if (player.y > canvas.height) initWorld();

  enemies.forEach(e => {
    e.x += e.dir * 1.2;
    if (e.x < canvas.width * 0.4 || e.x > canvas.width * 0.75) e.dir *= -1;
    if (collide(player, e)) initWorld();
  });

  if (collide(player, goal)) {
    isNight = !isNight;
    stage++;
    initWorld();
  }
}

// =======================
// DRAW
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

function drawButtons() {
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.strokeRect(buttons.left.x, buttons.left.y, 80, 80);
  ctx.fillText("◀", buttons.left.x + 40, buttons.left.y + 40);

  ctx.strokeRect(buttons.right.x, buttons.right.y, 80, 80);
  ctx.fillText("▶", buttons.right.x + 40, buttons.right.y + 40);

  ctx.strokeRect(buttons.up.x, buttons.up.y, 80, 80);
  ctx.fillText("▲", buttons.up.x + 40, buttons.up.y + 40);
}

function draw() {
  ctx.fillStyle = isNight ? "black" : "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const groundY = canvas.height * 0.75;
  ctx.strokeStyle = isNight ? "white" : "black";
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();

  pits.forEach(p => ctx.strokeRect(p.x, groundY, p.w, 2));
  ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);

  enemies.forEach(e => drawStickman(e, true));
  drawStickman(player);
  drawButtons();
}

// =======================
// LOOP
// =======================
function collide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
