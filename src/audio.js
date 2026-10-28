/* INKLING — audio sintetizado con Web Audio (sin archivos externos). */
'use strict';

INK.audio = (() => {
  let ctx = null;
  let master, musicBus, sfxBus;
  let noiseBuf = null;
  const settings = {
    music: INK.store.get('music', true),
    sfx: INK.store.get('sfx', true),
  };

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    musicBus.gain.value = settings.music ? 0.22 : 0;
    sfxBus.gain.value = settings.sfx ? 0.55 : 0;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function setMusic(on) {
    settings.music = on; INK.store.set('music', on);
    if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.22 : 0, ctx.currentTime, 0.05);
  }
  function setSfx(on) {
    settings.sfx = on; INK.store.set('sfx', on);
    if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.05);
  }

  function tone(freq, dur, { type = 'square', vol = 0.3, slide = 0, delay = 0, bus = sfxBus, attack = 0.005 } = {}) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, { vol = 0.3, freq = 1200, q = 1, type = 'lowpass', delay = 0, bus = sfxBus, sweep = 0 } = {}) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq + sweep), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t); s.stop(t + dur + 0.02);
  }

  const sfx = {
    jump() { tone(330, 0.14, { type: 'triangle', vol: 0.35, slide: 260 }); noise(0.05, { vol: 0.08, freq: 3000, type: 'highpass' }); },
    land() { noise(0.06, { vol: 0.12, freq: 700 }); },
    shoot() { noise(0.16, { vol: 0.35, freq: 1800, sweep: -1400, q: 3 }); tone(520, 0.08, { type: 'sine', vol: 0.12, slide: -260 }); },
    splat() { noise(0.12, { vol: 0.25, freq: 600, sweep: -400, q: 2 }); },
    erase() { tone(660, 0.07, { type: 'square', vol: 0.12 }); tone(990, 0.12, { type: 'square', vol: 0.1, delay: 0.06 }); noise(0.18, { vol: 0.15, freq: 2400, type: 'bandpass', q: 1.5 }); },
    stun() { tone(240, 0.12, { type: 'square', vol: 0.15, slide: -80 }); noise(0.1, { vol: 0.15, freq: 900 }); },
    hurt() { tone(420, 0.3, { type: 'sawtooth', vol: 0.2, slide: -300 }); noise(0.2, { vol: 0.2, freq: 500 }); },
    pickup() { tone(784, 0.08, { type: 'triangle', vol: 0.25 }); tone(1175, 0.14, { type: 'triangle', vol: 0.22, delay: 0.07 }); },
    checkpoint() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.22, delay: i * 0.08 })); },
    empty() { tone(160, 0.08, { type: 'square', vol: 0.12 }); },
    fall() { tone(500, 0.6, { type: 'triangle', vol: 0.25, slide: -400 }); },
    bossHit() { tone(180, 0.15, { type: 'square', vol: 0.2, slide: -60 }); noise(0.15, { vol: 0.3, freq: 1400, q: 2 }); },
    bossSlam() { tone(90, 0.35, { type: 'sine', vol: 0.5, slide: -40 }); noise(0.3, { vol: 0.35, freq: 300 }); },
    bossSpit() { noise(0.2, { vol: 0.25, freq: 900, sweep: 600, q: 4 }); },
    bossRoar() { tone(110, 0.6, { type: 'sawtooth', vol: 0.18, slide: 40 }); tone(165, 0.6, { type: 'sawtooth', vol: 0.12, slide: 30 }); },
    bossDie() { for (let i = 0; i < 6; i++) { noise(0.25, { vol: 0.3, freq: 400 + i * 200, delay: i * 0.12 }); } tone(220, 1.2, { type: 'triangle', vol: 0.25, slide: -180, delay: 0.2 }); },
    select() { tone(600, 0.05, { type: 'triangle', vol: 0.18 }); },
    confirm() { tone(660, 0.07, { type: 'triangle', vol: 0.22 }); tone(880, 0.1, { type: 'triangle', vol: 0.2, delay: 0.06 }); },
    page() { noise(0.35, { vol: 0.18, freq: 2600, sweep: -1800, type: 'bandpass', q: 0.8 }); },
    win() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.25, delay: i * 0.12 })); },
    lose() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.22, delay: i * 0.18 })); },
  };

  function play(name) {
    if (!ctx || !settings.sfx) return;
    if (sfx[name]) sfx[name]();
  }

  // --- Música: secuenciador sencillo con planificación anticipada ---
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz
  const TRACKS = {
    calm: {
      bpm: 104,
      lead: [72, 0, 76, 79, 0, 76, 74, 0, 72, 0, 69, 72, 0, 74, 76, 0, 77, 0, 76, 74, 0, 72, 74, 0, 76, 0, 72, 69, 0, 67, 72, 0],
      bass: [48, 0, 0, 0, 55, 0, 0, 0, 45, 0, 0, 0, 52, 0, 0, 0, 41, 0, 0, 0, 48, 0, 0, 0, 43, 0, 0, 0, 43, 0, 47, 0],
    },
    boss: {
      bpm: 138,
      lead: [69, 0, 72, 69, 76, 0, 75, 74, 72, 0, 69, 0, 67, 69, 0, 72, 69, 0, 72, 69, 77, 0, 76, 74, 76, 0, 72, 0, 71, 0, 68, 0],
      bass: [45, 0, 45, 0, 45, 0, 45, 0, 41, 0, 41, 0, 41, 0, 41, 0, 43, 0, 43, 0, 43, 0, 43, 0, 40, 0, 40, 0, 44, 0, 44, 0],
    },
    menu: {
      bpm: 84,
      lead: [76, 0, 0, 79, 0, 0, 81, 0, 79, 0, 0, 76, 0, 0, 74, 0, 72, 0, 0, 74, 0, 0, 76, 0, 74, 0, 0, 0, 0, 0, 0, 0],
      bass: [48, 0, 0, 0, 0, 0, 0, 0, 53, 0, 0, 0, 0, 0, 0, 0, 45, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0],
    },
  };
  let current = null;
  let step = 0;
  let nextTime = 0;
  let timer = null;

  function schedule() {
    if (!ctx || !current) return;
    const tr = TRACKS[current];
    const stepDur = 60 / tr.bpm / 2;
    while (nextTime < ctx.currentTime + 0.25) {
      const i = step % tr.lead.length;
      const delay = Math.max(0, nextTime - ctx.currentTime);
      if (tr.lead[i]) tone(N(tr.lead[i]), stepDur * 1.6, { type: 'triangle', vol: 0.32, bus: musicBus, delay });
      if (tr.bass[i]) tone(N(tr.bass[i]), stepDur * 3, { type: 'sine', vol: 0.45, bus: musicBus, delay });
      if (current !== 'menu' && i % 2 === 0) noise(0.03, { vol: i % 4 === 0 ? 0.1 : 0.05, freq: 5000, type: 'highpass', bus: musicBus, delay });
      nextTime += stepDur;
      step++;
    }
  }

  function music(name) {
    if (!ctx) { current = name; return; }
    if (current === name && timer) return;
    current = name;
    step = 0;
    nextTime = ctx.currentTime + 0.1;
    if (!timer) timer = setInterval(schedule, 60);
  }
  function stopMusic() { current = null; }

  // Si la música se pidió antes de que el usuario interactuara, arranca al desbloquear.
  function unlock() {
    const pending = current;
    init();
    if (ctx && pending && !timer) { current = null; music(pending); }
  }

  return { init: unlock, play, music, stopMusic, settings, setMusic, setSfx };
})();
