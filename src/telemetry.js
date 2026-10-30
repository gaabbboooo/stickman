/* INKLING — modo playtest (?playtest).
   Registra qué pasa en la partida (dónde mueres, cuánto tardas, qué descubres)
   para analizar sesiones con personas reales. No envía nada a ningún servidor:
   al final se muestra un código que la persona que modera la sesión copia
   en el registro de playtest. Sin el parámetro ?playtest no registra nada. */
'use strict';

INK.tel = (() => {
  const on = /[?&]playtest\b/.test(location.search);
  const t0 = performance.now();
  const s = { v: INK.VERSION, d: null, ev: [] };
  let lastScene = null;
  let panel = null;

  const now = () => Math.round((performance.now() - t0) / 100) / 10; // segundos, 1 decimal

  // Cada evento: [tipo, segundo de la sesión, x del jugador, dato extra opcional]
  function log(type, x = null, extra) {
    if (!on) return;
    const e = [type, now(), x === null ? null : Math.round(x)];
    if (extra !== undefined) e.push(extra);
    s.ev.push(e);
    if (s.ev.length > 4000) s.ev.shift();
  }

  // Código compacto y solo ASCII: "INK1." + base64(JSON)
  function code() {
    s.d = document.body.classList.contains('touch') ? 'tactil' : 'teclado';
    s.end = now();
    return 'INK1.' + btoa(JSON.stringify(s));
  }

  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'playtest';
    panel.innerHTML =
      '<div class="pt-badge">PLAYTEST</div>' +
      '<div class="pt-box"><p>Código de la sesión</p>' +
      '<textarea readonly aria-label="Código de la sesión"></textarea>' +
      '<button type="button">Copiar código</button></div>';
    document.body.appendChild(panel);
    const ta = panel.querySelector('textarea');
    const btn = panel.querySelector('button');
    btn.addEventListener('click', () => {
      ta.value = code();
      ta.select();
      const done = () => { btn.textContent = '¡Copiado!'; setTimeout(() => { btn.textContent = 'Copiar código'; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, () => document.execCommand('copy') && done());
      else if (document.execCommand('copy')) done();
    });
  }

  // El código se muestra en pausa, derrota y victoria (fuera de la acción).
  function sync(scene) {
    if (!on) return;
    if (!panel) buildPanel();
    if (scene === lastScene) return;
    lastScene = scene;
    log('scene', null, scene);
    const show = scene === 'pause' || scene === 'gameover' || scene === 'victory';
    panel.classList.toggle('show', show);
    if (show) panel.querySelector('textarea').value = code();
  }

  return { on, log, sync, code };
})();
