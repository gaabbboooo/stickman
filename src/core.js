/* INKLING — núcleo: espacio de nombres, utilidades y dibujo "a mano". */
'use strict';

const INK = (window.INK = {});

INK.VERSION = 'demo 1.0';
INK.W = 960; // resolución virtual
INK.H = 540;
INK.FONT = '"Patrick Hand", "Comic Sans MS", "Chalkboard SE", cursive';

INK.COL = {
  paper: '#f4ecd9',
  paperShade: '#e8dcc0',
  paperEdge: '#2b2721',
  rule: '#b4cbe0',
  margin: '#dc8f88',
  ink: '#1d2140',
  inkSoft: 'rgba(29,33,64,0.55)',
  inkFaint: 'rgba(29,33,64,0.16)',
  blue: '#2346c8',
  blueLight: '#7189e8',
  pencil: '#5a5d66',
  pencilFaint: 'rgba(90,93,102,0.28)',
  eraser: '#ec9aa6',
  eraserDark: '#b85d6c',
  red: '#c43a2f',
  white: '#fffdf6',
  gold: '#d8a321',
};

INK.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
INK.lerp = (a, b, t) => a + (b - a) * t;
INK.sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
INK.rand = (a, b) => a + Math.random() * (b - a);
INK.overlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Ruido determinista: el mismo trazo se repite hasta que cambia el "boil".
INK.hash = (a, b = 0) => {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
};

// "Line boil": los trazos tiemblan levemente varias veces por segundo,
// como en la animación dibujada a mano.
INK.boil = 0;
INK.setTime = (t) => { INK.boil = Math.floor(t * 7); };

const wob = (seed, amp) => (INK.hash(seed, INK.boil) - 0.5) * 2 * amp;
INK.wob = wob;

INK.sLine = (ctx, x1, y1, x2, y2, seed = 1, amp = 1.2) => {
  const mx = (x1 + x2) / 2 + wob(seed + 1, amp);
  const my = (y1 + y2) / 2 + wob(seed + 2, amp);
  ctx.beginPath();
  ctx.moveTo(x1 + wob(seed + 3, amp * 0.6), y1 + wob(seed + 4, amp * 0.6));
  ctx.quadraticCurveTo(mx, my, x2 + wob(seed + 5, amp * 0.6), y2 + wob(seed + 6, amp * 0.6));
  ctx.stroke();
};

// Rectángulo con trazos que se pasan un poco de la esquina.
INK.sRect = (ctx, x, y, w, h, seed = 1, amp = 1.2) => {
  const o = 3;
  INK.sLine(ctx, x - o, y, x + w + o * 0.5, y, seed, amp);
  INK.sLine(ctx, x + w, y - o * 0.5, x + w, y + h + o, seed + 10, amp);
  INK.sLine(ctx, x + w + o, y + h, x - o * 0.5, y + h, seed + 20, amp);
  INK.sLine(ctx, x, y + h + o * 0.5, x, y - o, seed + 30, amp);
};

INK.sCirclePath = (ctx, x, y, r, seed = 1, amp = 1, n = 14) => {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const k = i % n;
    const a = (k / n) * Math.PI * 2;
    const rr = r + wob(seed + k * 3, amp);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
};

INK.sCircle = (ctx, x, y, r, seed, amp, fill) => {
  INK.sCirclePath(ctx, x, y, r, seed, amp);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.stroke();
};

// Mancha de tinta irregular (rellena).
INK.blob = (ctx, x, y, r, seed, color, spikes = 9) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  const n = spikes * 2;
  for (let i = 0; i <= n; i++) {
    const k = i % n;
    const a = (k / n) * Math.PI * 2;
    const rr = r * (k % 2 ? 0.72 + INK.hash(seed, k) * 0.25 : 0.95 + INK.hash(seed + 7, k) * 0.35);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
};

// Sombreado con líneas diagonales dentro de un rectángulo.
INK.hatch = (ctx, x, y, w, h, gap = 12, color = INK.COL.pencilFaint, offset = 0) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const start = Math.floor((x - h - offset) / gap) * gap + offset;
  for (let sx = start; sx < x + w; sx += gap) {
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + h, y);
  }
  ctx.stroke();
  ctx.restore();
};

INK.text = (ctx, str, x, y, size = 24, color = INK.COL.ink, align = 'center', base = 'middle') => {
  ctx.font = `${size}px ${INK.FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillText(str, x, y);
};

// Almacenamiento seguro (puede fallar en modo privado o file://).
INK.store = {
  get(key, def) {
    try {
      const v = localStorage.getItem('inkling.' + key);
      return v === null ? def : JSON.parse(v);
    } catch (e) { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('inkling.' + key, JSON.stringify(val)); } catch (e) { /* sin almacenamiento */ }
  },
};
