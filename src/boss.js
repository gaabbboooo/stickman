/* INKLING — jefe final: El Corrector (un bote de corrector líquido). */
'use strict';

(() => {
  const C = INK.COL;
  const { sLine, sRect, blob, wob, sign, clamp, rand } = INK;

  class Corrector {
    constructor(x, world) {
      this.w = 64; this.h = 104;
      this.x = x; this.y = -160; // entra cayendo desde arriba
      this.ignorePlats = true; this.prevGround = false;
      this.vx = 0; this.vy = 0; this.onGround = false;
      this.maxHp = 14; this.hp = this.maxHp;
      this.state = 'intro'; this.st = 1.6; this.dir = -1;
      this.flash = 0; this.t = 0; this.enraged = false; this.alive = true;
      this.seed = 321; this.squash = 0; this.pattern = 0;
      this.arena = world.level.arena;
    }
    get cx() { return this.x + this.w / 2; }
    get speedMul() { return this.enraged ? 1.35 : 1; }

    update(dt, world) {
      this.t += dt; this.flash -= dt; this.st -= dt; this.squash *= 0.85;
      const p = world.player;
      const dx = p.cx - this.cx;
      // aterrizaje = ahora en el suelo y en el fotograma anterior no
      const landed = this.onGround && !this.prevGround;
      this.prevGround = this.onGround;

      switch (this.state) {
        case 'intro':
          if (landed) { this.land(world, false); INK.audio.play('bossRoar'); }
          if (this.st <= 0 && this.onGround) this.next();
          break;
        case 'walk':
          this.dir = sign(dx) || this.dir;
          this.vx = this.dir * 70 * this.speedMul;
          if (Math.abs(dx) < 40) this.vx = 0;
          if (this.st <= 0) this.next();
          break;
        case 'spitWind':
          this.vx = 0; this.dir = sign(dx) || this.dir;
          if (this.st <= 0) { this.spit(world); this.state = 'recover'; this.st = 0.7 / this.speedMul; }
          break;
        case 'hopWind':
          this.vx = 0;
          if (this.st <= 0) {
            this.state = 'hop';
            const target = clamp(p.cx - this.w / 2, this.arena.x1 + 20, this.arena.x2 - this.w - 20);
            const air = 0.85;
            this.vx = (target - this.x) / air;
            this.vy = -820;
            this.onGround = false;
          }
          break;
        case 'hop':
          if (landed) {
            this.vx = 0;
            this.land(world, true);
            this.state = 'recover'; this.st = 1.0 / this.speedMul;
          }
          break;
        case 'recover':
          this.vx = 0;
          if (this.st <= 0) this.next();
          break;
        case 'dying':
          this.vx = 0;
          if (Math.random() < 0.5) world.splash(this.x + rand(0, this.w), this.y + rand(0, this.h), Math.random() < 0.5 ? C.white : C.ink, 3);
          if (this.st <= 0) {
            this.alive = false;
            world.splash(this.cx, this.y + this.h / 2, C.white, 30);
            world.splash(this.cx, this.y + this.h / 2, C.blue, 20);
            world.decal(this.cx, this.y + this.h, 30);
            world.bossDefeated();
          }
          break;
      }

      if (this.state !== 'dying' || !this.onGround) {
        this.vy = Math.min(this.vy + INK.PHYS.gravity * dt, 1100);
        world.moveBody(this, dt);
      }
      this.x = clamp(this.x, this.arena.x1, this.arena.x2 - this.w);

      // contacto con el jugador
      if (this.state !== 'dying' && INK.overlap(this, p)) p.hurt(this.cx, world, 1.4);
    }

    next() {
      // patrón fijo y legible: caminar, escupir, caminar, saltar...
      const seq = ['walk', 'spit', 'walk', 'hop', 'spit', 'hop'];
      const s = seq[this.pattern % seq.length];
      this.pattern++;
      if (s === 'walk') { this.state = 'walk'; this.st = rand(0.9, 1.4) / this.speedMul; }
      if (s === 'spit') { this.state = 'spitWind'; this.st = 0.55 / this.speedMul; }
      if (s === 'hop') { this.state = 'hopWind'; this.st = 0.5 / this.speedMul; }
    }

    land(world, slam) {
      this.squash = 10;
      world.shake(slam ? 12 : 8);
      INK.audio.play('bossSlam');
      world.dust(this.cx, this.y + this.h, 12);
      if (slam) {
        world.spawnWave(this.x - 4, -1);
        world.spawnWave(this.x + this.w + 4, 1);
      }
    }

    spit(world) {
      INK.audio.play('bossSpit');
      const p = world.player;
      const n = this.enraged ? 5 : 3;
      const mouthX = this.cx + this.dir * 10, mouthY = this.y + 6;
      for (let i = 0; i < n; i++) {
        const dist = Math.abs(p.cx - mouthX) * (0.6 + i * (0.8 / (n - 1)));
        const air = 0.9;
        const vx = (this.dir * Math.max(80, dist)) / air;
        const vy = -0.5 * 900 * air - 40 + i * 20;
        world.spawnBlob(mouthX, mouthY, vx, vy);
      }
    }

    hitInk(world) {
      if (this.state === 'dying' || this.state === 'intro') return;
      this.hp -= 1; this.flash = 0.1;
      INK.audio.play('bossHit');
      world.splash(this.cx, this.y + 30, C.blue, 5);
      world.decalOn(this, 8);
      if (!this.enraged && this.hp <= this.maxHp / 2) {
        this.enraged = true;
        INK.audio.play('bossRoar');
        world.shake(10);
        world.floatText(this.cx, this.y - 20, '¡GRRR!', C.red);
      }
      if (this.hp <= 0) {
        this.state = 'dying'; this.st = 2.0; this.vx = 0;
        INK.audio.play('bossDie');
        world.shake(14);
      }
    }

    draw(ctx) {
      const shake = this.state === 'dying' ? wob(this.seed + 5, 4) * 1.4 : 0;
      const sq = this.squash;
      const x = this.x + shake - sq / 2, w = this.w + sq;
      const y = this.y + sq, h = this.h - sq;
      ctx.lineWidth = 3; ctx.strokeStyle = C.ink;
      // cuerpo del bote
      ctx.fillStyle = this.flash > 0 ? C.blueLight : C.white;
      ctx.fillRect(x, y + 26, w, h - 26);
      // etiqueta
      ctx.fillStyle = this.enraged ? '#f2b7a8' : '#cfe0f2';
      ctx.fillRect(x + 4, y + 46, w - 8, 34);
      sRect(ctx, x + 4, y + 46, w - 8, 34, this.seed + 3, 0.8);
      INK.text(ctx, 'CORR.', x + w / 2, y + 63, 15, C.ink);
      sRect(ctx, x, y + 26, w, h - 26, this.seed, 1.2);
      // cuello y tapón con pincel
      ctx.fillStyle = C.white;
      ctx.fillRect(x + w / 2 - 14, y + 12, 28, 16);
      sRect(ctx, x + w / 2 - 14, y + 12, 28, 16, this.seed + 6, 0.8);
      ctx.fillStyle = C.ink;
      ctx.fillRect(x + w / 2 - 10, y, 20, 13);
      // cara
      const fx = x + w / 2 + this.dir * 8;
      ctx.fillStyle = C.ink;
      const eyeY = y + 36;
      if (this.state === 'dying') {
        ctx.lineWidth = 2.5;
        sLine(ctx, fx - 14, eyeY - 4, fx - 6, eyeY + 4, 1, 0.5); sLine(ctx, fx - 6, eyeY - 4, fx - 14, eyeY + 4, 2, 0.5);
        sLine(ctx, fx + 6, eyeY - 4, fx + 14, eyeY + 4, 3, 0.5); sLine(ctx, fx + 14, eyeY - 4, fx + 6, eyeY + 4, 4, 0.5);
      } else {
        ctx.beginPath(); ctx.arc(fx - 10, eyeY, 3.5, 0, 7); ctx.arc(fx + 10, eyeY, 3.5, 0, 7); ctx.fill();
        ctx.lineWidth = 3;
        sLine(ctx, fx - 17, eyeY - 10, fx - 5, eyeY - 5, 5, 0.6);
        sLine(ctx, fx + 17, eyeY - 10, fx + 5, eyeY - 5, 6, 0.6);
      }
      // boca (se abre al escupir)
      const open = this.state === 'spitWind' ? 7 : 2;
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.ellipse(fx, y + 90, 9, open, 0, 0, 7); ctx.fill();
      // goteo de corrector
      ctx.fillStyle = C.white; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      const drip = 6 + Math.sin(this.t * 3) * 3;
      ctx.beginPath(); ctx.ellipse(x + 10, y + 26 + drip, 4, drip, 0, 0, 7); ctx.fill(); ctx.stroke();
      // manchas de tinta que va acumulando
      if (this.stains) for (const st of this.stains) blob(ctx, x + st.dx, y + st.dy, st.r, st.seed, C.blue, 6);
      // telegrafía del salto
      if (this.state === 'hopWind') {
        ctx.strokeStyle = C.red; ctx.lineWidth = 2;
        sLine(ctx, x - 8, y + h, x - 18, y + h - 16, 11, 1);
        sLine(ctx, x + w + 8, y + h, x + w + 18, y + h - 16, 12, 1);
      }
    }
  }
  INK.Corrector = Corrector;

  // Gota de corrector lanzada por el jefe.
  INK.WhiteBlob = class {
    constructor(x, y, vx, vy) { Object.assign(this, { x, y, vx, vy }); this.r = 10; this.alive = true; this.seed = Math.floor(Math.random() * 99); }
    get box() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
    update(dt, world) {
      this.vy += 900 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      if (world.solidAt(this.x, this.y + this.r)) {
        this.alive = false;
        world.spawnPuddle(this.x);
        world.splash(this.x, this.y, C.white, 6);
        INK.audio.play('splat');
      }
      if (this.y > 700) this.alive = false;
      if (this.alive && INK.overlap(this.box, world.player)) {
        this.alive = false;
        world.player.hurt(this.x, world);
        world.splash(this.x, this.y, C.white, 6);
      }
    }
    draw(ctx) {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      INK.sCirclePath(ctx, this.x, this.y, this.r, this.seed, 1.5, 10);
      ctx.fillStyle = C.white; ctx.fill(); ctx.stroke();
    }
  };

  // Charco de corrector: tapa el papel unos segundos y hace daño al pisarlo.
  INK.Puddle = class {
    constructor(x, groundY) { this.x = x - 24; this.w = 48; this.y = groundY - 6; this.h = 6; this.life = 3; this.alive = true; }
    get box() { return { x: this.x + 4, y: this.y - 2, w: this.w - 8, h: this.h + 2 }; }
    update(dt, world) {
      this.life -= dt;
      if (this.life <= 0) this.alive = false;
      else if (this.life < 2.8 && INK.overlap(this.box, world.player)) world.player.hurt(this.x + this.w / 2, world, 0.8);
    }
    draw(ctx) {
      ctx.globalAlpha = Math.min(1, this.life * 2);
      ctx.fillStyle = C.white; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(this.x + this.w / 2, this.y + 4, this.w / 2, 6, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  // Onda de choque al aterrizar: hay que saltarla.
  INK.Wave = class {
    constructor(x, dir, groundY) { this.x = x; this.dir = dir; this.y = groundY; this.alive = true; this.t = 0; }
    get box() { return { x: this.x - 12, y: this.y - 24, w: 24, h: 24 }; }
    update(dt, world) {
      this.t += dt;
      this.x += this.dir * 330 * dt;
      const a = world.level.arena;
      if (this.x < a.x1 || this.x > a.x2) this.alive = false;
      if (this.alive && INK.overlap(this.box, world.player)) world.player.hurt(this.x - this.dir * 20, world);
    }
    draw(ctx) {
      ctx.fillStyle = C.white; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      const h = 20 + Math.sin(this.t * 30) * 3;
      ctx.beginPath();
      ctx.moveTo(this.x - 14, this.y);
      ctx.quadraticCurveTo(this.x - this.dir * 2, this.y - h * 1.4, this.x + 14, this.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  };
})();
