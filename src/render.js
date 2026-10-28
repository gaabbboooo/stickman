/* INKLING — dibujo del cuaderno, del nivel y del HUD. */
'use strict';

(() => {
  const C = INK.COL;
  const { sLine, sRect, sCircle, blob, hatch, text, wob } = INK;
  const W = INK.W, H = INK.H;

  /* ---------- papel ---------- */
  INK.drawPaper = (ctx, scroll = 0, margin = true) => {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);
    // pautado azul
    ctx.strokeStyle = C.rule; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = 72; y < H; y += 30) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();
    // margen rojo (se desplaza con la página)
    if (margin) {
      const mx = 64 - scroll;
      if (mx > -4 && mx < W + 4) {
        ctx.strokeStyle = C.margin; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();
      }
    }
    // viñeteado suave
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(120,90,40,0)');
    g.addColorStop(1, 'rgba(120,90,40,0.18)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  /* ---------- garabatos de fondo (paralaje) ---------- */
  const doodles = (() => {
    const list = [];
    let x = 120;
    let i = 0;
    while (x < 3200) {
      const k = INK.hash(i, 77);
      const type = k < 0.3 ? 'cloud' : k < 0.55 ? 'tree' : k < 0.75 ? 'house' : k < 0.88 ? 'star' : 'plane';
      list.push({ x, y: type === 'cloud' || type === 'star' || type === 'plane' ? 110 + INK.hash(i, 3) * 120 : 330, type, s: 0.8 + INK.hash(i, 5) * 0.6, seed: i * 31 });
      x += 160 + INK.hash(i, 9) * 220;
      i++;
    }
    return list;
  })();

  function drawDoodle(ctx, d, x) {
    ctx.save();
    ctx.translate(x, d.y); ctx.scale(d.s, d.s);
    ctx.strokeStyle = C.pencilFaint; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const s = d.seed;
    if (d.type === 'cloud') {
      ctx.beginPath();
      ctx.arc(0, 0, 16, Math.PI, 0); ctx.arc(26, -6, 20, Math.PI, 0); ctx.arc(54, 0, 15, Math.PI, 0);
      ctx.lineTo(-16, 0); ctx.stroke();
    } else if (d.type === 'tree') {
      sLine(ctx, 0, 0, 0, 60, s, 1.2);
      sCircle(ctx, 0, -14, 24, s + 3, 2.5);
    } else if (d.type === 'house') {
      sRect(ctx, -26, 10, 52, 46, s, 1.2);
      sLine(ctx, -32, 12, 0, -18, s + 50, 1); sLine(ctx, 0, -18, 32, 12, s + 60, 1);
      sRect(ctx, -6, 30, 12, 26, s + 70, 0.8);
    } else if (d.type === 'star') {
      for (let k = 0; k < 5; k++) {
        const a1 = (k / 5) * Math.PI * 2 - Math.PI / 2, a2 = ((k + 2) / 5) * Math.PI * 2 - Math.PI / 2;
        sLine(ctx, Math.cos(a1) * 14, Math.sin(a1) * 14, Math.cos(a2) * 14, Math.sin(a2) * 14, s + k * 9, 0.8);
      }
    } else {
      // avión de papel
      sLine(ctx, -24, 0, 24, -8, s, 0.8); sLine(ctx, 24, -8, -14, 10, s + 9, 0.8); sLine(ctx, -14, 10, -24, 0, s + 18, 0.8);
      sLine(ctx, -24, 0, 0, 2, s + 27, 0.6);
    }
    ctx.restore();
  }

  INK.drawBackdrop = (ctx, camX) => {
    const par = 0.35;
    const off = camX * par;
    for (const d of doodles) {
      const x = d.x - off;
      if (x > -120 && x < W + 120) drawDoodle(ctx, d, x);
    }
    // colinas de lápiz
    ctx.strokeStyle = C.pencilFaint; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let sx = -10; sx <= W + 10; sx += 10) {
      const wx = sx + camX * 0.55;
      const y = 400 - Math.sin(wx * 0.004) * 36 - Math.sin(wx * 0.011 + 1) * 14;
      if (sx === -10) ctx.moveTo(sx, y); else ctx.lineTo(sx, y);
    }
    ctx.stroke();
  };

  /* ---------- nivel ---------- */
  INK.drawSolid = (ctx, s, idx) => {
    if (s.kind === 'ground') {
      ctx.fillStyle = C.paperShade;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      hatch(ctx, s.x, s.y + 6, s.w, s.h, 13);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
      // borde superior por tramos (el trazo largo se ve más hecho a mano)
      const seg = 140;
      for (let x = s.x; x < s.x + s.w; x += seg) {
        sLine(ctx, x - 2, s.y, Math.min(s.x + s.w, x + seg) + 2, s.y, idx * 100 + x, 1.1);
      }
      ctx.lineWidth = 2.4;
      sLine(ctx, s.x, s.y - 2, s.x, s.y + s.h, idx * 7 + 3, 1.2);
      sLine(ctx, s.x + s.w, s.y - 2, s.x + s.w, s.y + s.h, idx * 7 + 5, 1.2);
      // briznas de hierba garabateadas
      ctx.lineWidth = 1.4; ctx.strokeStyle = C.pencil;
      for (let x = s.x + 18; x < s.x + s.w - 10; x += 37) {
        if (INK.hash(x, 11) < 0.45) continue;
        sLine(ctx, x, s.y, x - 3, s.y - 7, x, 0.6); sLine(ctx, x + 4, s.y, x + 6, s.y - 9, x + 1, 0.6);
      }
    } else if (s.kind === 'block') {
      // pila de libros
      const n = Math.max(1, Math.round(s.h / 25));
      const bh = s.h / n;
      const colors = ['#c9725f', '#5f86b8', '#d3b45a', '#7aa36b'];
      for (let i = 0; i < n; i++) {
        const y = s.y + i * bh;
        const inset = (INK.hash(idx, i) - 0.5) * 8;
        ctx.fillStyle = colors[(idx + i) % colors.length];
        ctx.fillRect(s.x + inset, y, s.w, bh);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
        sRect(ctx, s.x + inset, y, s.w, bh, idx * 50 + i * 9, 0.8);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
        sLine(ctx, s.x + inset + 6, y + bh / 2, s.x + inset + s.w - 6, y + bh / 2, idx * 50 + i * 9 + 4, 0.5);
      }
    } else {
      // plataforma: una regla de madera
      ctx.fillStyle = '#e7c98f';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.2;
      sRect(ctx, s.x, s.y, s.w, s.h, idx * 13 + 1, 0.9);
      ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(29,33,64,0.6)';
      for (let x = s.x + 6; x < s.x + s.w - 2; x += 8) {
        ctx.beginPath(); ctx.moveTo(x, s.y); ctx.lineTo(x, s.y + ((x - s.x) % 40 < 8 ? 9 : 5)); ctx.stroke();
      }
    }
  };

  // Los huecos son agujeros rasgados en el papel: se ve la mesa oscura debajo.
  INK.drawTears = (ctx, world, x0, x1) => {
    const gs = world.solids.filter((s) => s.kind === 'ground').sort((a, b) => a.x - b.x);
    for (let i = 0; i < gs.length - 1; i++) {
      const a = gs[i].x + gs[i].w, b = gs[i + 1].x;
      if (b - a < 4 || b < x0 || a > x1) continue;
      const top = world.groundY + 8;
      ctx.fillStyle = C.paperEdge;
      ctx.beginPath();
      ctx.moveTo(a, top);
      const n = Math.max(3, Math.floor((b - a) / 14));
      for (let k = 1; k < n; k++) ctx.lineTo(a + ((b - a) * k) / n, top + 4 + INK.hash(i * 50 + k, 3) * 14);
      ctx.lineTo(b, top); ctx.lineTo(b, H + 10); ctx.lineTo(a, H + 10);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
    }
  };

  INK.drawSpikes = (ctx, s, i) => {
    // chinchetas
    const n = Math.max(1, Math.floor(s.w / 20));
    const step = s.w / n;
    for (let k = 0; k < n; k++) {
      const x = s.x + step * k + step / 2;
      ctx.fillStyle = C.red; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x, s.y + s.h - 4, 8, 4, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C.pencil; ctx.lineWidth = 2;
      sLine(ctx, x, s.y + s.h - 6, x, s.y - 4, i * 30 + k, 0.4);
      ctx.fillStyle = '#e8e8ea'; ctx.beginPath(); ctx.moveTo(x - 2, s.y); ctx.lineTo(x, s.y - 6); ctx.lineTo(x + 2, s.y); ctx.fill();
    }
  };

  INK.drawCheckpoint = (ctx, c, groundY, i) => {
    const x = c.x, y = groundY;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
    sLine(ctx, x, y, x, y - 70, i * 17, 0.8);
    // cinta de marcapáginas
    const lift = c.active ? Math.min(1, c.wave * 3) : 0;
    const top = y - 70;
    ctx.fillStyle = c.active ? C.red : 'rgba(90,93,102,0.35)';
    const wv = Math.sin(c.wave * 5 + i) * 3 * (c.active ? 1 : 0.3);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + 26 + wv, top + 4);
    ctx.lineTo(x + 18 + wv, top + 14 - lift * 2);
    ctx.lineTo(x + 26 + wv, top + 24);
    ctx.lineTo(x, top + 22);
    ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1.5; ctx.stroke();
  };

  INK.drawNote = (ctx, n) => {
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.rotate(-0.025);
    const lines = n.touch && document.body.classList.contains('touch') ? n.touch : n.lines;
    lines.forEach((l, i) => text(ctx, l, 0, i * 26, 23, C.inkSoft));
    ctx.restore();
  };

  INK.drawExit = (ctx, ex, t) => {
    // esquina de página doblada que invita a "pasar la página"
    const x = ex.x, y = ex.y, w = 70, h = 90;
    const pulse = 1 + Math.sin(t * 4) * 0.04;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(pulse, pulse); ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = C.white; ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w - 24, 0); ctx.lineTo(w, 24); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.paperShade;
    ctx.beginPath(); ctx.moveTo(w - 24, 0); ctx.lineTo(w - 24, 24); ctx.lineTo(w, 24); ctx.closePath(); ctx.fill(); ctx.stroke();
    text(ctx, 'FIN', w / 2 - 2, h / 2 - 6, 24, C.blue);
    text(ctx, '→', w / 2, h / 2 + 18, 26, C.blue);
    ctx.restore();
  };

  /* ---------- HUD ---------- */
  function heart(ctx, x, y, full, seed) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.bezierCurveTo(-14, -3, -9, -15, 0, -7);
    ctx.bezierCurveTo(9, -15, 14, -3, 0, 7);
    ctx.closePath();
    if (full) { ctx.fillStyle = C.red; ctx.fill(); }
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
    if (!full) { ctx.lineWidth = 1.5; sLine(ctx, -6, -6, 5, 3, seed, 0.6); }
    ctx.restore();
  }

  INK.drawHUD = (ctx, world) => {
    const p = world.player;
    // corazones
    for (let i = 0; i < p.maxHearts; i++) heart(ctx, 34 + i * 34, 34, i < p.hearts, i * 7);
    // tintero
    const bx = 30, by = 60;
    const warn = world.inkWarn > 0 && Math.floor(world.inkWarn * 10) % 2 === 0;
    ctx.fillStyle = 'rgba(255,253,246,0.85)';
    ctx.fillRect(bx, by, 26, 30);
    const lvl = p.ink / p.maxInk;
    ctx.fillStyle = C.blue;
    ctx.fillRect(bx + 2, by + 2 + 26 * (1 - lvl), 22, 26 * lvl);
    ctx.strokeStyle = warn ? C.red : C.ink; ctx.lineWidth = 2;
    sRect(ctx, bx, by, 26, 30, 501, 0.8);
    ctx.fillStyle = C.ink; ctx.fillRect(bx + 7, by - 7, 12, 7);
    for (let i = 0; i < p.maxInk; i++) {
      const filled = i < Math.floor(p.ink);
      ctx.beginPath(); ctx.arc(bx + 42 + i * 15, by + 15, 5, 0, 7);
      ctx.fillStyle = filled ? C.blue : 'rgba(29,33,64,0.12)'; ctx.fill();
      ctx.strokeStyle = warn ? C.red : C.inkSoft; ctx.lineWidth = 1.3; ctx.stroke();
    }
    if (warn) text(ctx, '¡Sin tinta! Espera o recoge gotas', bx + 42, by + 42, 18, C.red, 'left');

    // pausa (también funciona como recordatorio)
    if (!document.body.classList.contains('touch')) text(ctx, 'Esc · pausa', W - 22, 26, 18, C.inkSoft, 'right');

    // barra del jefe
    const b = world.boss;
    if (b && b.state !== 'intro') {
      const w = 360, x = W / 2 - w / 2, y = 30;
      text(ctx, 'EL CORRECTOR', W / 2, y - 10, 20, C.ink);
      ctx.fillStyle = 'rgba(255,253,246,0.9)'; ctx.fillRect(x, y, w, 14);
      ctx.fillStyle = b.enraged ? C.red : C.ink;
      ctx.fillRect(x + 2, y + 2, (w - 4) * Math.max(0, b.hp / b.maxHp), 10);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; sRect(ctx, x, y, w, 14, 777, 0.8);
    }

    // rótulos
    if (world.banner) {
      const bn = world.banner;
      const k = Math.min(1, (bn.max - bn.life) * 4, bn.life * 3);
      ctx.globalAlpha = Math.max(0, k);
      ctx.font = `30px ${INK.FONT}`;
      const tw = ctx.measureText(bn.str).width + 50;
      ctx.fillStyle = C.white;
      ctx.fillRect(W / 2 - tw / 2, 96, tw, 46);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      sRect(ctx, W / 2 - tw / 2, 96, tw, 46, 888, 1);
      text(ctx, bn.str, W / 2, 120, 30, C.ink);
      ctx.globalAlpha = 1;
    }
  };

  /* ---------- escena completa ---------- */
  INK.drawWorld = (ctx, world) => {
    const camX = Math.round(world.camX);
    INK.drawPaper(ctx, camX);
    INK.drawBackdrop(ctx, camX);

    ctx.save();
    ctx.translate(-camX + world.shakeX, world.shakeY);
    const x0 = camX - 80, x1 = camX + W + 80;
    const vis = (x, w) => x + w > x0 && x < x1;

    for (const n of world.level.notes) if (vis(n.x - 160, 320)) INK.drawNote(ctx, n);
    world.checkpoints.forEach((c, i) => { if (i > 0 && vis(c.x - 10, 50)) INK.drawCheckpoint(ctx, c, world.groundY, i); });
    INK.drawTears(ctx, world, x0, x1);
    world.solids.forEach((s, i) => { if (vis(s.x, s.w)) INK.drawSolid(ctx, s, i); });
    world.movers.forEach((m, i) => INK.drawSolid(ctx, m, 90 + i));
    world.spikes.forEach((s, i) => { if (vis(s.x, s.w)) INK.drawSpikes(ctx, s, i); });

    // manchas de tinta persistentes
    for (const d of world.decals) if (vis(d.x - d.r, d.r * 2)) blob(ctx, d.x, d.y, d.r, d.seed, 'rgba(35,70,200,0.55)', 8);

    // muros de la arena: hojas de corrector seco
    for (const wl of world.arenaWalls) {
      ctx.fillStyle = 'rgba(255,253,246,0.92)';
      ctx.fillRect(wl.x, 0, wl.w, world.groundY);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      sLine(ctx, wl.x, 0, wl.x, world.groundY, 41, 1.5);
      sLine(ctx, wl.x + wl.w, 0, wl.x + wl.w, world.groundY, 42, 1.5);
    }

    if (world.exitOpen) INK.drawExit(ctx, world.level.exit, world.exitT);
    for (const k of world.pickups) if (vis(k.x - 12, 24)) k.draw(ctx);
    for (const pd of world.puddles) pd.draw(ctx);
    for (const e of world.enemies) if (vis(e.x, e.w)) e.draw(ctx);
    if (world.boss) world.boss.draw(ctx);
    for (const wv of world.waves) wv.draw(ctx);
    for (const b of world.blobs) b.draw(ctx);
    for (const s of world.shots) s.draw(ctx);
    world.player.draw(ctx, world.t);
    for (const pt of world.particles) pt.draw(ctx);
    for (const tx of world.texts) {
      ctx.globalAlpha = Math.min(1, tx.life * 2);
      text(ctx, tx.str, tx.x, tx.y, 22, tx.color);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // número de página al pie
    const page = Math.floor((camX + W / 2) / 1600) + 1;
    text(ctx, `pág. ${page}`, W - 22, H - 18, 18, C.inkSoft, 'right');

    INK.drawHUD(ctx, world);
  };
})();
