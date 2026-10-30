/* INKLING — el mundo de juego: física, cámara, nivel y reglas. */
'use strict';

(() => {
  const C = INK.COL;
  const { clamp, rand, overlap } = INK;

  class World {
    constructor(onEvent) {
      this.onEvent = onEvent; // 'gameover' | 'victory'
      this.level = INK.LEVEL;
      this.groundY = this.level.groundY;
      this.minX = 0; this.maxX = this.level.width;
      this.solids = this.level.solids.map((s) => ({ ...s }));
      this.movers = this.level.movers.map((m) => ({ ...m, dir: 1, dx: 0, kind: 'plat' }));
      this.spikes = this.level.spikes.map((s) => ({ x: s.x, y: this.groundY - 14, w: s.w, h: 14 }));
      this.checkpoints = this.level.checkpoints.map((c, i) => ({ x: c.x, active: i === 0, wave: 0 }));
      this.cpIndex = 0;
      this.player = new INK.Player(this.level.start.x, this.level.start.y);
      this.enemies = this.level.enemies.map((d) => INK.makeEnemy(d, this));
      this.pickups = this.level.pickups.map((d) => new INK.Pickup(d));
      this.shots = []; this.particles = []; this.decals = []; this.texts = [];
      this.blobs = []; this.puddles = []; this.waves = [];
      this.boss = null; this.arenaActive = false; this.bossDone = false; this.arenaWalls = [];
      this.exitOpen = false; this.exitT = 0;
      this.camX = 0; this.shakeAmt = 0; this.shakeX = 0; this.shakeY = 0;
      this.t = 0; this.inkWarn = 0; this.banner = null; this.finished = false;
      this.stats = { time: 0, shots: 0, erased: 0, hits: 0, falls: 0 };
      this.updateCamera(1, true);
      this.showBanner('Capítulo 1 · El margen del cuaderno', 3);
    }

    /* ---------- consultas de colisión ---------- */
    allSolids() { return this.arenaWalls.length ? this.solids.concat(this.movers, this.arenaWalls) : this.solids.concat(this.movers); }

    solidAt(x, y) {
      for (const s of this.allSolids()) {
        if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
      }
      return false;
    }

    // Movimiento por ejes con resolución AABB. Las plataformas 'plat' solo frenan desde arriba.
    moveBody(b, dt) {
      const solids = this.allSolids();
      // transporte por plataformas móviles
      if (b.carrier && b.onGround) b.x += b.carrier.dx;
      b.x += b.vx * dt;
      for (const s of solids) {
        if (s.kind === 'plat' || !overlap(b, s)) continue;
        if (b.vx > 0 || (b.vx === 0 && b.x + b.w / 2 < s.x + s.w / 2)) b.x = s.x - b.w;
        else b.x = s.x + s.w;
        b.vx = 0;
      }
      const prevBottom = b.y + b.h;
      b.y += b.vy * dt;
      b.onGround = false; b.carrier = null;
      for (const s of solids) {
        if (!overlap(b, s)) continue;
        if (s.kind === 'plat') {
          if (b.ignorePlats) continue;
          if (b.vy >= 0 && prevBottom <= s.y + 1) {
            b.y = s.y - b.h; b.vy = 0; b.onGround = true;
            if (s.dx !== undefined) b.carrier = s;
          }
          continue;
        }
        if (b.vy > 0) { b.y = s.y - b.h; b.vy = 0; b.onGround = true; }
        else if (b.vy < 0) { b.y = s.y + s.h; b.vy = 0; }
      }
      // ¿apoyado justo encima? (necesario para no "flotar" al no haber velocidad)
      if (!b.onGround && b.vy >= 0) {
        for (const s of solids) {
          if (s.kind === 'plat' && b.ignorePlats) continue;
          if (b.x + b.w > s.x && b.x < s.x + s.w && Math.abs(b.y + b.h - s.y) < 0.5) {
            b.onGround = true; if (s.dx !== undefined) b.carrier = s; break;
          }
        }
      }
    }

    /* ---------- generación de efectos ---------- */
    spawnShot(x, y, dir, carry) { this.shots.push(new INK.Shot(x, y, dir, carry)); }
    spawnBlob(x, y, vx, vy) { this.blobs.push(new INK.WhiteBlob(x, y, vx, vy)); }
    spawnPuddle(x) { this.puddles.push(new INK.Puddle(x, this.groundY)); }
    spawnWave(x, dir) { this.waves.push(new INK.Wave(x, dir, this.groundY)); }

    splash(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(80, 320);
        this.particles.push(new INK.Particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 120, rand(0.35, 0.8), rand(2, 4.5), color));
      }
    }
    dust(x, y, n) {
      for (let i = 0; i < n; i++) {
        this.particles.push(new INK.Particle(x + rand(-8, 8), y - 2, rand(-90, 90), rand(-90, -20), rand(0.25, 0.5), rand(1.5, 3), C.pencil, 200, 'ring'));
      }
    }
    puff(x, y) { this.particles.push(new INK.Particle(x, y, 0, -20, 0.5, 8, C.pencil, 0, 'ring')); }
    crumb(x, y) { this.particles.push(new INK.Particle(x, y, rand(-40, 40), rand(-120, -40), rand(0.4, 0.7), rand(1.5, 2.5), C.eraser, 700, 'crumb')); }
    decal(x, y, r) {
      this.decals.push({ x, y, r: r * rand(0.7, 1.2), seed: Math.floor(rand(0, 9999)) });
      if (this.decals.length > 160) this.decals.shift();
    }
    decalOn(ent, r) {
      ent.stains = ent.stains || [];
      ent.stains.push({ dx: rand(8, ent.w - 8), dy: rand(30, ent.h - 10), r: r * rand(0.6, 1.1), seed: Math.floor(rand(0, 999)) });
      if (ent.stains.length > 14) ent.stains.shift();
    }
    floatText(x, y, str, color = C.ink) { this.texts.push({ x, y, str, color, life: 1 }); }
    shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }
    showBanner(str, dur = 2) { this.banner = { str, life: dur, max: dur }; }

    /* ---------- reglas ---------- */
    playerDied() {
      const p = this.player;
      p.dead = true;
      this.finished = true;
      INK.tel.log('die', p.cx, this.boss ? this.boss.hp : undefined);
      INK.audio.play('lose');
      this.onEvent('gameover');
    }

    respawnAfterFall() {
      const p = this.player;
      this.stats.falls++;
      INK.tel.log('fall', this.player.cx);
      p.hearts -= 1;
      this.shake(6);
      if (p.hearts <= 0) { p.hearts = 0; this.playerDied(); return; }
      INK.audio.play('fall');
      if (this.arenaActive) this.resetArena();
      const cp = this.checkpoints[this.cpIndex];
      const hearts = p.hearts, ink = p.ink;
      p.spawn(cp.x, this.groundY);
      p.hearts = hearts; p.ink = Math.max(ink, 3);
      p.invul = 1.5;
      this.camX = clamp(p.cx - INK.W * 0.42, 0, this.level.width - INK.W);
      this.showBanner('¡Te has caído de la página!', 1.6);
    }

    // Tras la derrota: volver al último marcapáginas con la partida intacta.
    continueFromCheckpoint() {
      const p = this.player;
      if (this.arenaActive) this.resetArena();
      const cp = this.checkpoints[this.cpIndex];
      INK.tel.log('continue', cp.x, this.cpIndex);
      p.spawn(cp.x, this.groundY);
      p.hearts = p.maxHearts; p.ink = p.maxInk; p.invul = 1.5;
      this.finished = false; this.ended = null;
      this.shots = []; this.blobs = []; this.waves = []; this.puddles = [];
      this.updateCamera(1, true);
      INK.audio.music('calm');
      this.showBanner('¡Otra vez a la página!', 1.6);
    }

    startArena() {
      const a = this.level.arena;
      this.arenaActive = true;
      this.arenaWalls = [
        { x: a.x1 - 30, y: -400, w: 30, h: 1000, kind: 'block' },
        { x: a.x2, y: -400, w: 30, h: 1000, kind: 'block' },
      ];
      this.boss = new INK.Corrector(a.bossX, this);
      INK.tel.log('boss', this.player.cx);
      INK.audio.music('boss');
      this.showBanner('¡El Corrector quiere tapar la página!', 2.4);
    }

    resetArena() {
      this.arenaActive = false; this.arenaWalls = []; this.boss = null;
      this.blobs = []; this.puddles = []; this.waves = [];
      INK.audio.music('calm');
    }

    bossDefeated() {
      this.bossDone = true; this.boss = null;
      INK.tel.log('bossdown', this.player.cx);
      this.blobs = []; this.waves = []; this.puddles = [];
      this.arenaWalls = [this.arenaWalls[1]]; // se abre la izquierda; la derecha es el final del nivel
      this.exitOpen = true;
      INK.audio.music('calm');
      this.showBanner('¡Corrector derrotado! Pasa la página →', 3);
    }

    /* ---------- actualización ---------- */
    update(dt) {
      this.t += dt;
      if (!this.finished) this.stats.time += dt;
      const p = this.player;

      for (const m of this.movers) {
        const old = m.x;
        m.x += m.dir * m.speed * dt;
        if (m.x > m.x2) { m.x = m.x2; m.dir = -1; }
        if (m.x < m.x1) { m.x = m.x1; m.dir = 1; }
        m.dx = m.x - old;
      }

      if (!p.dead && !this.finished) {
        p.update(dt, this);
        if (p.y > INK.H + 80) this.respawnAfterFall();
      }

      for (const e of this.enemies) if (e.alive) { e.update(dt, this); if (!p.dead) e.contact(p, this); }
      this.enemies = this.enemies.filter((e) => e.alive);

      for (const s of this.spikes) {
        if (overlap({ x: s.x + 4, y: s.y + 4, w: s.w - 8, h: s.h - 4 }, p) && p.hurt(s.x + s.w / 2, this, 0.6, 'chinchetas')) p.vy = -520;
      }

      // proyectiles contra enemigos, gotas de corrector y jefe
      for (const sh of this.shots) {
        sh.update(dt, this);
        if (!sh.alive) continue;
        const box = sh.box;
        for (const e of this.enemies) {
          if (e.alive && overlap(box, e)) { e.hitInk(this, sh); sh.alive = false; this.decal(sh.x, e.y + e.h, 6); break; }
        }
        if (!sh.alive) continue;
        for (const b of this.blobs) {
          if (b.alive && overlap(box, b.box)) { b.alive = false; sh.alive = false; this.splash(b.x, b.y, C.white, 6); this.splash(b.x, b.y, C.blue, 4); INK.audio.play('splat'); break; }
        }
        if (sh.alive && this.boss && overlap(box, this.boss)) { this.boss.hitInk(this); sh.alive = false; }
        if (sh.x < this.camX - 60 || sh.x > this.camX + INK.W + 60) sh.alive = false;
      }
      this.shots = this.shots.filter((s) => s.alive);

      for (const k of this.pickups) k.update(dt, this);

      // puntos de guardado (marcapáginas)
      this.checkpoints.forEach((c, i) => {
        c.wave += dt;
        if (!c.active && p.x > c.x - 10 && i > this.cpIndex) {
          c.active = true; c.wave = 0; this.cpIndex = i;
          INK.tel.log('cp', c.x, i);
          INK.audio.play('checkpoint');
          const healed = p.hearts < p.maxHearts;
          p.hearts = p.maxHearts;
          this.floatText(c.x, this.groundY - 110, healed ? 'Marcapáginas · ¡corazones recuperados!' : 'Marcapáginas guardado', C.red);
        }
      });

      // arena del jefe
      const a = this.level.arena;
      if (!this.arenaActive && !this.bossDone && p.x > a.trigger) this.startArena();
      if (this.boss) this.boss.update(dt, this);
      for (const b of this.blobs) b.update(dt, this);
      for (const w of this.waves) w.update(dt, this);
      for (const d of this.puddles) d.update(dt, this);
      this.blobs = this.blobs.filter((b) => b.alive);
      this.waves = this.waves.filter((w) => w.alive);
      this.puddles = this.puddles.filter((d) => d.alive);

      // salida: pasar la página
      if (this.exitOpen) {
        this.exitT += dt;
        const ex = this.level.exit;
        if (!this.finished && overlap(p, { x: ex.x, y: ex.y, w: 70, h: 90 })) {
          this.finished = true;
          INK.audio.play('win');
          INK.tel.log('win', p.cx, Math.round(this.stats.time));
          this.onEvent('victory');
        }
      }

      for (const pt of this.particles) pt.update(dt);
      this.particles = this.particles.filter((pt) => pt.life > 0);
      for (const tx of this.texts) { tx.life -= dt * 0.9; tx.y -= 30 * dt; }
      this.texts = this.texts.filter((tx) => tx.life > 0);
      if (this.banner) { this.banner.life -= dt; if (this.banner.life <= 0) this.banner = null; }
      this.inkWarn -= dt;

      this.updateCamera(dt);
    }

    updateCamera(dt, snap = false) {
      const p = this.player;
      let target = p.cx - INK.W * 0.42 + p.facing * 60;
      let lo = 0, hi = this.level.width - INK.W;
      if (this.arenaActive && !this.bossDone) { lo = this.level.arena.x1; hi = this.level.arena.x1; }
      target = clamp(target, lo, hi);
      this.camX = snap ? target : this.camX + (target - this.camX) * Math.min(1, dt * 5);
      this.camX = clamp(this.camX, 0, this.level.width - INK.W);
      this.shakeAmt *= Math.pow(0.002, dt);
      this.shakeX = (Math.random() - 0.5) * this.shakeAmt;
      this.shakeY = (Math.random() - 0.5) * this.shakeAmt;
    }
  }

  INK.World = World;
})();
