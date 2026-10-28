/* INKLING — escenas: título, controles, partida, pausa, derrota y victoria. */
'use strict';

(() => {
  const C = INK.COL;
  const { text, sLine, sRect, blob } = INK;
  const W = INK.W, H = INK.H;
  const inp = () => INK.input;
  const onOff = (v) => (v ? 'Sí' : 'No');

  const ui = {
    scene: 'title',
    world: null,
    index: 0,
    trans: null,
    t: 0,
    sceneT: 0,
    deco: null,
    lastResult: null,
  };
  INK.ui = ui;

  /* ---------- transición: pasar página ---------- */
  function go(fn) {
    if (ui.trans) return;
    INK.audio.play('page');
    ui.trans = { t: 0, dur: 0.8, fn, switched: false };
  }

  function setScene(s) {
    ui.scene = s; ui.index = 0; ui.sceneT = 0; inp().hoverMoved = false;
    inp().setTouchVisible(s === 'play');
    if (s === 'title' || s === 'controls') INK.audio.music('menu');
  }

  function newGame() {
    ui.world = new INK.World((ev) => { ui.world.ended = { type: ev, t: 0 }; });
    setScene('play');
    INK.audio.music('calm');
  }

  /* ---------- menús ---------- */
  function menuItems() {
    const a = INK.audio.settings;
    switch (ui.scene) {
      case 'title':
        return [
          { label: 'Jugar', act: () => go(newGame) },
          { label: 'Cómo se juega', act: () => go(() => setScene('controls')) },
          { label: `Música: ${onOff(a.music)}`, act: () => INK.audio.setMusic(!a.music) },
          { label: `Efectos: ${onOff(a.sfx)}`, act: () => INK.audio.setSfx(!a.sfx) },
        ];
      case 'controls':
        return [{ label: 'Volver', act: () => go(() => setScene('title')), back: true }];
      case 'pause':
        return [
          { label: 'Continuar', act: resume, back: true },
          { label: 'Reiniciar capítulo', act: () => go(newGame) },
          { label: `Música: ${onOff(a.music)}`, act: () => INK.audio.setMusic(!a.music) },
          { label: `Efectos: ${onOff(a.sfx)}`, act: () => INK.audio.setSfx(!a.sfx) },
          { label: 'Menú principal', act: () => go(() => setScene('title')) },
        ];
      case 'gameover':
        return [
          { label: 'Seguir desde el marcapáginas', act: () => go(() => { ui.world.continueFromCheckpoint(); setScene('play'); }) },
          { label: 'Reiniciar capítulo', act: () => go(newGame) },
          { label: 'Menú principal', act: () => go(() => setScene('title')) },
        ];
      case 'victory':
        return [
          { label: 'Jugar otra vez', act: () => go(newGame) },
          { label: 'Menú principal', act: () => go(() => setScene('title')) },
        ];
    }
    return [];
  }

  function menuLayout() {
    const items = menuItems();
    const base = { title: 318, controls: 488, pause: 210, gameover: 330, victory: 410 }[ui.scene];
    const gap = ui.scene === 'pause' ? 52 : 50;
    return items.map((it, i) => ({ ...it, x: W / 2, y: base + i * gap, w: 440, h: 44 }));
  }

  function pause() {
    if (ui.scene !== 'play' || ui.trans) return;
    ui.scene = 'pause'; ui.index = 0; ui.sceneT = 0; inp().hoverMoved = false;
    inp().setTouchVisible(false);
    inp().releaseAll();
    INK.audio.play('select');
  }
  function resume() {
    ui.scene = 'play'; ui.sceneT = 0;
    inp().setTouchVisible(true);
    inp().releaseAll();
  }
  ui.autoPause = pause;

  function handleMenu() {
    const items = menuLayout();
    if (!items.length || ui.trans) return;
    const I = inp();
    if (I.nav('down')) { ui.index = (ui.index + 1) % items.length; INK.audio.play('select'); }
    if (I.nav('up')) { ui.index = (ui.index - 1 + items.length) % items.length; INK.audio.play('select'); }
    const hit = (p) => items.findIndex((it) => Math.abs(p.x - it.x) < it.w / 2 && Math.abs(p.y - it.y) < it.h / 2);
    // el ratón solo cambia la selección cuando se mueve de verdad
    if (I.hover && I.hoverMoved) {
      I.hoverMoved = false;
      const h = hit(I.hover);
      if (h >= 0 && h !== ui.index) { ui.index = h; INK.audio.play('select'); }
    }
    // pequeña espera para que la pulsación que abrió el menú no lo active
    if (ui.sceneT < 0.12) return;
    for (const p of I.taps()) {
      const h = hit(p);
      if (h >= 0) { ui.index = h; INK.audio.play('confirm'); items[h].act(); return; }
    }
    if (I.nav('confirm')) { INK.audio.play('confirm'); items[ui.index].act(); return; }
    if (I.nav('back')) {
      const b = items.find((it) => it.back);
      if (b) { INK.audio.play('confirm'); b.act(); }
    }
  }

  function drawMenu(ctx) {
    const items = menuLayout();
    items.forEach((it, i) => {
      const sel = i === ui.index;
      text(ctx, it.label, it.x, it.y, sel ? 34 : 30, sel ? C.ink : C.inkSoft);
      if (sel) {
        ctx.font = `34px ${INK.FONT}`;
        const tw = ctx.measureText(it.label).width;
        ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.lineCap = 'round';
        sLine(ctx, it.x - tw / 2 - 6, it.y + 19, it.x + tw / 2 + 6, it.y + 17, 900 + i, 1.5);
        blob(ctx, it.x - tw / 2 - 26, it.y, 7, 40 + INK.boil, C.blue, 6);
      }
    });
  }

  /* ---------- decoración del título ---------- */
  function titleDeco() {
    if (!ui.deco) {
      const fake = { groundY: 470 };
      ui.deco = {
        p: new INK.Player(0, 0),
        g: INK.makeEnemy({ type: 'garabato', x: W - 250, min: 0, max: 0 }, fake),
        b: INK.makeEnemy({ type: 'borrador', x: W - 170, min: 0, max: 0 }, fake),
      };
      ui.deco.p.x = 160; ui.deco.p.y = 470 - ui.deco.p.h; ui.deco.p.onGround = true;
    }
    return ui.deco;
  }

  function drawLogo(ctx, cx, cy, size) {
    // salpicaduras detrás del título
    blob(ctx, cx - size * 1.55, cy + 6, size * 0.28, 11, 'rgba(35,70,200,0.85)', 9);
    blob(ctx, cx + size * 1.7, cy - size * 0.25, size * 0.16, 12, 'rgba(35,70,200,0.7)', 7);
    blob(ctx, cx + size * 1.45, cy + size * 0.35, size * 0.07, 13, 'rgba(35,70,200,0.7)', 6);
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(-0.03);
    text(ctx, 'INKLING', 3, 4, size, 'rgba(29,33,64,0.18)');
    text(ctx, 'INKLING', 0, 0, size, C.ink);
    ctx.restore();
  }

  function drawTitle(ctx) {
    INK.drawPaper(ctx, 0, true);
    INK.drawBackdrop(ctx, ui.t * 25);
    drawLogo(ctx, W / 2, 150, 120);
    text(ctx, 'Capítulo 1 · El Ejército del Borrador', W / 2, 238, 28, C.inkSoft);
    // dos islas de papel a los lados del menú: el héroe frente a sus enemigos
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
    sLine(ctx, 70, 470, 290, 470, 5, 1.2);
    INK.hatch(ctx, 70, 474, 220, 40, 13);
    sLine(ctx, W - 290, 470, W - 70, 470, 6, 1.2);
    INK.hatch(ctx, W - 290, 474, 220, 40, 13);
    const d = titleDeco();
    d.p.facing = 1;
    d.p.shootPose = Math.sin(ui.t * 1.5) > 0.7 ? 1 : 0;
    d.p.draw(ctx, ui.t);
    d.g.t = ui.t; d.g.dir = -1; d.g.draw(ctx);
    d.b.dir = -1; d.b.draw(ctx);
    drawMenu(ctx);
    text(ctx, `Insomnio creative lab · ${INK.VERSION}`, W / 2, H - 16, 18, C.inkSoft);
    text(ctx, document.body.classList.contains('touch') ? 'Toca una opción' : '↑ ↓ para elegir · Enter / Espacio para aceptar', W / 2, 286, 19, C.pencil);
  }

  function drawControls(ctx) {
    INK.drawPaper(ctx, 0, true);
    text(ctx, 'Cómo se juega', W / 2, 52, 44, C.ink);
    text(ctx, 'El Ejército del Borrador quiere dejar el cuaderno en blanco.', W / 2, 98, 23, C.inkSoft);
    text(ctx, 'Cruza la página, borra a sus soldados con tinta y derrota al Corrector.', W / 2, 124, 23, C.inkSoft);

    const touch = document.body.classList.contains('touch');
    const rows = touch
      ? [['◀ ▶', 'caminar'], ['▲', 'saltar (mantén para saltar más alto)'], ['✒', 'lanzar tinta'], ['❚❚', 'pausa']]
      : [['← →  ·  A D', 'caminar'], ['Espacio · ↑ · W', 'saltar (mantén para saltar más alto)'], ['X · J', 'lanzar tinta'], ['Esc · P', 'pausa']];
    rows.forEach(([k, v], i) => {
      const y = 176 + i * 34;
      text(ctx, k, 380, y, 25, C.blue, 'right');
      text(ctx, v, 410, y, 25, C.ink, 'left');
    });

    // leyenda de enemigos
    const ly = 345;
    ctx.strokeStyle = C.ink;
    const fake = { groundY: ly + 15 };
    const g = INK.makeEnemy({ type: 'garabato', x: 150, min: 0, max: 0 }, fake); g.t = ui.t; g.seed = 5;
    g.y = ly - 15; g.draw(ctx);
    text(ctx, 'Garabato · 1 mancha', 165, ly + 44, 21, C.ink);
    const b = INK.makeEnemy({ type: 'borrador', x: 400, min: 0, max: 0 }, fake); b.seed = 9; b.y = ly - 15;
    b.draw(ctx);
    text(ctx, 'Borrador · 3 manchas, embiste', 426, ly + 44, 21, C.ink);
    INK.drawSpikes(ctx, { x: 650, y: ly + 1, w: 40, h: 14 }, 1);
    text(ctx, 'Chinchetas · ¡salta!', 670, ly + 44, 21, C.ink);
    text(ctx, 'Pisa a los enemigos para aturdirlos · Las gotas azules rellenan el tintero', W / 2, ly + 90, 21, C.inkSoft);
    text(ctx, 'Tienes 3 corazones. Los marcapáginas rojos guardan tu avance.', W / 2, ly + 114, 21, C.inkSoft);
    drawMenu(ctx);
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return `${m}:${r < 10 ? '0' : ''}${r}`;
  }

  function overlay(ctx, alpha) {
    ctx.fillStyle = `rgba(244,236,217,${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  function card(ctx, x, y, w, h, seed) {
    ctx.fillStyle = C.white; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5; sRect(ctx, x, y, w, h, seed, 1.2);
  }

  function drawPause(ctx) {
    INK.drawWorld(ctx, ui.world);
    overlay(ctx, 0.7);
    card(ctx, W / 2 - 200, 95, 400, 380, 61);
    text(ctx, 'Pausa', W / 2, 140, 46, C.ink);
    drawMenu(ctx);
  }

  function drawGameOver(ctx) {
    INK.drawWorld(ctx, ui.world);
    // la tinta se derrama sobre la página
    const k = Math.min(1, ui.sceneT * 1.6);
    ctx.fillStyle = 'rgba(29,33,64,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(W, 0);
    const depth = k * H;
    for (let x = W; x >= 0; x -= 40) ctx.lineTo(x, depth + Math.sin(x * 0.05 + ui.t * 2) * 14 * (1 - k * 0.5) + INK.hash(x, 3) * 30 * k);
    ctx.closePath(); ctx.fill();
    if (k < 0.6) return;
    card(ctx, W / 2 - 250, 120, 500, 340, 71);
    text(ctx, 'Te han borrado', W / 2, 168, 48, C.ink);
    text(ctx, 'Te has quedado sin corazones.', W / 2, 216, 22, C.inkSoft);
    text(ctx, `Enemigos borrados: ${ui.world.stats.erased}  ·  Tiempo: ${fmtTime(ui.world.stats.time)}`, W / 2, 250, 21, C.inkSoft);
    drawMenu(ctx);
  }

  function drawVictory(ctx) {
    INK.drawPaper(ctx, 0, true);
    INK.drawBackdrop(ctx, ui.t * 15);
    // estallido de tinta celebratorio
    const spots = [[120, 70], [190, 300], [100, 430], [840, 60], [880, 260], [790, 450], [700, 30]];
    spots.forEach(([x, y], i) => blob(ctx, x, y, 12 + INK.hash(i, 2) * 16, i * 9, 'rgba(35,70,200,0.55)', 7));
    text(ctx, '¡Capítulo superado!', W / 2, 92, 58, C.ink);
    text(ctx, 'El Corrector ha quedado seco y el cuaderno sigue lleno de dibujos.', W / 2, 146, 23, C.inkSoft);
    const s = ui.world ? ui.world.stats : { time: 0, shots: 0, erased: 0, hits: 0, falls: 0 };
    const rows = [
      ['Tiempo', fmtTime(s.time)],
      ['Enemigos borrados', `${s.erased}`],
      ['Manchas lanzadas', `${s.shots}`],
      ['Golpes recibidos', `${s.hits + s.falls}`],
    ];
    card(ctx, W / 2 - 220, 180, 440, 170, 81);
    rows.forEach(([k, v], i) => {
      text(ctx, k, W / 2 - 180, 214 + i * 36, 25, C.ink, 'left');
      text(ctx, v, W / 2 + 180, 214 + i * 36, 25, C.blue, 'right');
    });
    text(ctx, 'Fin de la demo · Gracias por jugar', W / 2, 375, 22, C.inkSoft);
    drawMenu(ctx);
  }

  function drawTransition(ctx) {
    const tr = ui.trans;
    if (!tr) return;
    const k = tr.t / tr.dur;
    // una hoja entra desde la derecha y sale por la izquierda
    const e = (v) => v * v * (3 - 2 * v);
    const x = k < 0.5 ? W * (1 - e(k * 2)) : -W * e((k - 0.5) * 2);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x - 18, 0, 18, H);
    ctx.translate(x, 0);
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    INK.drawPaper(ctx, -1000, false);
    text(ctx, 'INKLING', W / 2, H / 2, 64, 'rgba(29,33,64,0.25)');
    ctx.restore();
  }

  /* ---------- ciclo ---------- */
  ui.update = (dt) => {
    ui.t += dt; ui.sceneT += dt;
    INK.setTime(ui.t);
    const I = inp();

    if (ui.trans) {
      const tr = ui.trans;
      tr.t += dt;
      if (!tr.switched && tr.t >= tr.dur / 2) { tr.switched = true; tr.fn(); }
      if (tr.t >= tr.dur) ui.trans = null;
    }

    if (ui.scene === 'play') {
      const end = ui.world.ended;
      if (I.was('pause') && !ui.trans && !end) pause();
      else ui.world.update(dt);
      if (end) {
        end.t += dt;
        if (end.type === 'gameover' && end.t > 0.9 && ui.scene === 'play') {
          ui.scene = 'gameover'; ui.index = 0; ui.sceneT = 0;
          inp().setTouchVisible(false); INK.audio.stopMusic();
        }
        if (end.type === 'victory' && end.t > 0.7 && !ui.trans && !end.done) {
          end.done = true;
          go(() => { setScene('victory'); INK.audio.stopMusic(); });
        }
      }
    } else {
      handleMenu();
      if (ui.scene === 'gameover' && ui.world) ui.world.update(dt); // las partículas terminan de caer
    }
  };

  ui.draw = (ctx) => {
    switch (ui.scene) {
      case 'title': drawTitle(ctx); break;
      case 'controls': drawControls(ctx); break;
      case 'play': INK.drawWorld(ctx, ui.world); break;
      case 'pause': drawPause(ctx); break;
      case 'gameover': drawGameOver(ctx); break;
      case 'victory': drawVictory(ctx); break;
    }
    drawTransition(ctx);
  };

  ui.start = () => setScene('title');
  // Accesos usados por las pruebas automáticas.
  ui._newGame = newGame;
  ui._setScene = setScene;
})();
