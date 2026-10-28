/* INKLING — Capítulo 1: "El margen del cuaderno".
   Todas las medidas están en píxeles del mundo (alto visible = 540). */
'use strict';

INK.LEVEL = (() => {
  const G = 460; // altura del suelo
  const ground = (x1, x2) => ({ x: x1, y: G, w: x2 - x1, h: 140, kind: 'ground' });
  const plat = (x, y, w) => ({ x, y, w, h: 18, kind: 'plat' }); // plataforma de un solo sentido
  const block = (x, y, w, h) => ({ x, y, w, h, kind: 'block' }); // bloque sólido (libros)

  return {
    width: 6400,
    groundY: G,
    start: { x: 150, y: G },
    solids: [
      // 1. Primeras páginas: aprender a moverse, saltar y lanzar tinta
      ground(-200, 1000),
      block(470, 410, 70, 50),
      // 2. Huecos y plataformas
      ground(1090, 1500),
      plat(1290, 370, 120),
      plat(1545, 405, 80),
      ground(1660, 2300),
      // 3. Llegan los Borradores
      ground(2380, 2720),
      ground(2800, 3220),
      block(3060, 400, 60, 60),
      plat(3270, 400, 70),
      ground(3380, 3900),
      // 4. Dificultad creciente
      ground(4250, 4700),
      plat(4745, 395, 70),
      plat(4860, 350, 70),
      ground(4960, 6600),
      // 5. Arena del Corrector
      plat(5590, 365, 110),
      plat(6060, 365, 110),
    ],
    movers: [
      // plataforma móvil sobre el gran hueco
      { x: 3925, y: 420, w: 90, h: 18, x1: 3925, x2: 4140, speed: 70 },
    ],
    spikes: [
      { x: 2960, w: 50 },
      { x: 4470, w: 60 },
      { x: 5150, w: 40 },
    ],
    enemies: [
      { type: 'garabato', x: 820, min: 640, max: 980 },
      { type: 'garabato', x: 1800, min: 1680, max: 2000 },
      { type: 'garabato', x: 2120, min: 2020, max: 2280 },
      { type: 'borrador', x: 2560, min: 2400, max: 2700 },
      { type: 'garabato', x: 2900, min: 2820, max: 2950 },
      { type: 'volador', x: 3320, y: 295, min: 3240, max: 3420 },
      { type: 'borrador', x: 3550, min: 3400, max: 3700 },
      { type: 'garabato', x: 4320, min: 4260, max: 4460 },
      { type: 'borrador', x: 4600, min: 4545, max: 4690 },
      { type: 'volador', x: 4800, y: 262, min: 4720, max: 4920 },
      { type: 'borrador', x: 5050, min: 4980, max: 5140 },
      { type: 'garabato', x: 5260, min: 5200, max: 5330 },
    ],
    pickups: [
      { x: 1350, y: 335 },
      { x: 2200, y: 430 },
      { x: 3300, y: 365 },
      { x: 3815, y: 430 },
      { x: 4895, y: 315 },
      { x: 5340, y: 430 },
      // en la arena: recargas para el combate
      { x: 5645, y: 330, respawn: true },
      { x: 6115, y: 330, respawn: true },
    ],
    checkpoints: [
      { x: 150 },
      { x: 2240 },
      { x: 3640 },
      { x: 5370 },
    ],
    notes: [
      { x: 170, y: 270, lines: ['← →  o  A D', 'para caminar'], touch: ['◀ ▶', 'para caminar'] },
      { x: 400, y: 250, lines: ['Espacio / ↑ / W', 'para saltar'], touch: ['▲ para saltar', '(mantén para llegar más alto)'] },
      { x: 660, y: 250, lines: ['X / J para lanzar tinta', 'Borra a los Garabatos'], touch: ['✒ para lanzar tinta', 'Borra a los Garabatos'] },
      { x: 1180, y: 250, lines: ['Recoge gotas', 'para rellenar el tintero'] },
      { x: 2470, y: 250, lines: ['Los Borradores aguantan', 'tres manchas.', '¡No te dejes embestir!'] },
      { x: 4030, y: 240, lines: ['Espera a la regla', 'y súbete'] },
      { x: 5190, y: 250, lines: ['Cuidado:', 'aquí vive el Corrector'] },
    ],
    arena: { x1: 5400, x2: 6360, trigger: 5490, bossX: 6180 },
    exit: { x: 6250, y: G - 90 },
  };
})();
