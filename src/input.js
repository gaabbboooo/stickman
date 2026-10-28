/* INKLING — entrada: teclado, botones táctiles y punteros para menús. */
'use strict';

INK.input = (() => {
  const held = { left: false, right: false, jump: false, shoot: false };
  const pressed = new Set(); // acciones pulsadas en este fotograma
  const touchHeld = { left: false, right: false, jump: false, shoot: false };
  let pointerTaps = []; // toques/clics en coordenadas virtuales

  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump',
    KeyX: 'shoot', KeyJ: 'shoot', KeyK: 'shoot', ShiftLeft: 'shoot',
    Escape: 'pause', KeyP: 'pause', Backspace: 'back',
    Enter: 'confirm', NumpadEnter: 'confirm',
    ArrowDown: 'down', KeyS: 'down',
  };
  const keyHeld = {};
  const codes = new Set(); // teclas físicas pulsadas en este fotograma
  const NAV = {
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    confirm: ['Enter', 'NumpadEnter', 'Space', 'KeyX', 'KeyJ'],
    back: ['Escape', 'KeyP', 'Backspace'],
  };

  function action(code) { return KEYMAP[code]; }

  window.addEventListener('keydown', (e) => {
    const a = action(e.code);
    INK.audio.init();
    if (!a) return;
    e.preventDefault();
    if (!keyHeld[e.code]) { pressed.add(a); codes.add(e.code); }
    keyHeld[e.code] = true;
    refresh();
  });
  window.addEventListener('keyup', (e) => {
    const a = action(e.code);
    if (!a) return;
    e.preventDefault();
    keyHeld[e.code] = false;
    refresh();
  });

  function refresh() {
    for (const k of Object.keys(held)) held[k] = touchHeld[k];
    for (const code of Object.keys(keyHeld)) {
      if (!keyHeld[code]) continue;
      const a = KEYMAP[code];
      if (a in held) held[a] = true;
    }
  }

  // Evita teclas "pegadas" al cambiar de pestaña o perder el foco.
  function releaseAll() {
    for (const k of Object.keys(keyHeld)) keyHeld[k] = false;
    for (const k of Object.keys(touchHeld)) touchHeld[k] = false;
    refresh();
  }
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  // --- Botones táctiles ---
  function bindTouch(el) {
    const a = el.dataset.action;
    const down = (e) => {
      e.preventDefault();
      INK.audio.init();
      if (a === 'pause') { pressed.add('pause'); return; }
      if (!touchHeld[a]) pressed.add(a);
      touchHeld[a] = true;
      el.classList.add('on');
      refresh();
    };
    const up = (e) => {
      e.preventDefault();
      if (a === 'pause') return;
      touchHeld[a] = false;
      el.classList.remove('on');
      refresh();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function setupTouch() {
    document.querySelectorAll('[data-action]').forEach(bindTouch);
    const showTouch = () => document.body.classList.add('touch');
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) showTouch();
    window.addEventListener('touchstart', showTouch, { passive: true, once: true });
  }

  // --- Toques y clics sobre el lienzo (menús) ---
  function setupPointer(canvas, toVirtual) {
    canvas.addEventListener('pointerdown', (e) => {
      INK.audio.init();
      const p = toVirtual(e.clientX, e.clientY);
      pointerTaps.push(p);
    });
    canvas.addEventListener('pointermove', (e) => {
      INK.input.hover = toVirtual(e.clientX, e.clientY);
      INK.input.hoverMoved = true;
    });
  }

  return {
    held,
    hover: null,
    was(a) { return pressed.has(a); },
    nav(n) { return NAV[n].some((c) => codes.has(c)); },
    taps() { return pointerTaps; },
    endFrame() { pressed.clear(); codes.clear(); pointerTaps = []; },
    setupTouch,
    setupPointer,
    releaseAll,
    setTouchVisible(on) { document.body.classList.toggle('playing', on); },
  };
})();
