/* INKLING — arranque, escalado del lienzo y bucle principal a paso fijo. */
'use strict';

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, ox: 0, oy: 0, dpr: 1 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth, ch = window.innerHeight;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    const scale = Math.min(cw / INK.W, ch / INK.H);
    view.scale = scale; view.dpr = dpr;
    view.ox = (cw - INK.W * scale) / 2;
    view.oy = (ch - INK.H * scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  const toVirtual = (cx, cy) => ({ x: (cx - view.ox) / view.scale, y: (cy - view.oy) / view.scale });

  INK.input.setupTouch();
  INK.input.setupPointer(canvas, toVirtual);

  // Pausa automática si la pestaña pierde el foco durante la partida.
  const autoPause = () => { if (INK.ui.scene === 'play' && !(INK.ui.world && INK.ui.world.ended)) INK.ui.autoPause(); };
  window.addEventListener('blur', autoPause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });

  const STEP = 1 / 60;
  let acc = 0;
  let last = performance.now();

  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25; // tras una pausa larga, no "teletransportar" el juego
    acc += dt;
    while (acc >= STEP) {
      INK.ui.update(STEP);
      INK.input.endFrame();
      acc -= STEP;
    }
    render();
    requestAnimationFrame(frame);
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = INK.COL.paperEdge;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const s = view.scale * view.dpr;
    ctx.setTransform(s, 0, 0, s, view.ox * view.dpr, view.oy * view.dpr);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, INK.W, INK.H); ctx.clip();
    INK.ui.draw(ctx);
    ctx.restore();
  }

  INK.view = view;
  INK.render = render;

  function boot() {
    document.getElementById('loading')?.remove();
    INK.ui.start();
    // ?test: modo de pruebas automáticas (el bucle se avanza a mano con INK.step).
    if (/[?&]test\b/.test(location.search)) {
      INK.step = (n = 1) => { for (let i = 0; i < n; i++) { INK.ui.update(STEP); INK.input.endFrame(); } render(); };
      INK.ready = true;
      return;
    }
    requestAnimationFrame((t) => { last = t; frame(t); });
    INK.ready = true;
  }

  // Espera a la tipografía (máx. 2 s) para que el primer fotograma ya se vea bien.
  const fontReady = document.fonts && document.fonts.load ? document.fonts.load(`30px "Patrick Hand"`) : Promise.resolve();
  Promise.race([fontReady, new Promise((r) => setTimeout(r, 2000))]).then(boot, boot);
})();
