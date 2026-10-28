/* INKLING — jugador, enemigos, proyectiles, recogibles y partículas. */
'use strict';

(() => {
  const C = INK.COL;
  const { sLine, sCircle, sRect, blob, wob, clamp, sign, rand } = INK;

  const PHYS = {
    accel: 2200, airAccel: 1500, friction: 2400, maxSpeed: 215,
    gravity: 1900, jump: 690, maxFall: 950, coyote: 0.1, buffer: 0.13,
  };
  INK.PHYS = PHYS;

  /* ======================= JUGADOR ======================= */
  class Player {
    constructor(x, y) {
      this.w = 20; this.h = 44;
      this.hearts = 3; this.maxHearts = 3;
      this.maxInk = 6; this.ink = 6;
      this.spawn(x, y);
    }
    spawn(x, footY) {
      this.x = x; this.y = footY - this.h;
      this.vx = 0; this.vy = 0;
      this.onGround = false; this.coyote = 0; this.jumpBuf = 0; this.jumpCut = true;
      this.facing = 1; this.invul = 0; this.shootCd = 0; this.shootPose = 0;
      this.regen = 0; this.sinceShot = 9; this.run = 0; this.land = 0;
      this.hurtT = 0; this.carrier = null; this.dead = false;
    }
    get cx() { return this.x + this.w / 2; }

    update(dt, world) {
      const inp = INK.input;
      const h = inp.held;
      const dir = (h.right ? 1 : 0) - (h.left ? 1 : 0);
      const controllable = this.hurtT <= 0;

      if (dir && controllable) {
        const a = this.onGround ? PHYS.accel : PHYS.airAccel;
        // giro más ágil al cambiar de dirección
        const boost = sign(this.vx) !== dir && this.vx !== 0 ? 1.8 : 1;
        this.vx += dir * a * boost * dt;
        this.vx = clamp(this.vx, -PHYS.maxSpeed, PHYS.maxSpeed);
        this.facing = dir;
      } else {
        const f = (this.onGround ? PHYS.friction : PHYS.friction * 0.35) * dt;
        this.vx = Math.abs(this.vx) <= f ? 0 : this.vx - sign(this.vx) * f;
      }

      // salto con margen "coyote" y búfer
      this.coyote = this.onGround ? PHYS.coyote : this.coyote - dt;
      this.jumpBuf = inp.was('jump') ? PHYS.buffer : this.jumpBuf - dt;
      if (this.jumpBuf > 0 && this.coyote > 0 && controllable) {
        this.vy = -PHYS.jump; this.coyote = 0; this.jumpBuf = 0; this.jumpCut = false;
        this.onGround = false; this.carrier = null;
        INK.audio.play('jump');
        world.dust(this.cx, this.y + this.h, 5);
      }
      if (!this.jumpCut && !h.jump && this.vy < 0) { this.vy *= 0.45; this.jumpCut = true; }
      if (this.vy >= 0) this.jumpCut = true;

      this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);

      const wasGround = this.onGround;
      const fallSpeed = this.vy;
      world.moveBody(this, dt);
      if (this.onGround && !wasGround && fallSpeed > 300) {
        this.land = 0.12;
        INK.audio.play('land');
        world.dust(this.cx, this.y + this.h, 4);
      }

      // límites del nivel
      if (this.x < world.minX) { this.x = world.minX; this.vx = Math.max(0, this.vx); }
      if (this.x + this.w > world.maxX) { this.x = world.maxX - this.w; this.vx = Math.min(0, this.vx); }

      // disparo de tinta
      this.shootCd -= dt; this.sinceShot += dt; this.shootPose -= dt;
      if ((inp.was('shoot') || (h.shoot && this.shootCd <= -0.05)) && this.shootCd <= 0 && controllable) {
        if (this.ink >= 1) {
          this.ink -= 1;
          this.shootCd = 0.24; this.sinceShot = 0; this.shootPose = 0.18;
          world.spawnShot(this.cx + this.facing * 14, this.y + 17, this.facing, this.vx);
          INK.audio.play('shoot');
          world.stats.shots++;
        } else if (inp.was('shoot')) {
          INK.audio.play('empty');
          world.puff(this.cx + this.facing * 14, this.y + 17);
          world.inkWarn = 0.6;
          this.shootCd = 0.2;
        }
      }
      // el tintero se rellena lentamente
      if (this.ink < this.maxInk) {
        this.regen += dt * (this.sinceShot > 0.6 ? 1.6 : 1);
        if (this.regen >= 1.1) { this.regen = 0; this.ink += 1; }
      } else this.regen = 0;

      this.invul -= dt; this.hurtT -= dt; this.land -= dt;
      this.run += Math.abs(this.vx) * dt * 0.055;
    }

    hurt(fromX, world, knock = 1) {
      if (this.invul > 0 || this.dead) return false;
      this.hearts -= 1;
      world.stats.hits++;
      this.invul = 1.4; this.hurtT = 0.28;
      this.vx = sign(this.cx - fromX || -this.facing) * 260 * knock;
      this.vy = -380;
      this.onGround = false; this.carrier = null;
      INK.audio.play('hurt');
      world.shake(8);
      world.splash(this.cx, this.y + 18, C.red, 10);
      if (this.hearts <= 0) world.playerDied();
      return true;
    }

    draw(ctx, t) {
      if (this.invul > 0 && Math.floor(this.invul * 14) % 2 === 0 && !this.dead) return;
      const x = this.cx;
      const foot = this.y + this.h;
      const s = 77;
      const moving = this.onGround && Math.abs(this.vx) > 20;
      const ph = this.run;
      const squash = this.land > 0 ? 3 : 0;
      const headY = this.y + 10 + squash;
      const hip = foot - 17;
      const neck = headY + 10;

      // bufanda de tinta: rasgo reconocible del personaje
      ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const flow = Math.sin(t * 9) * 3;
      const back = -this.facing;
      ctx.beginPath();
      ctx.moveTo(x, neck);
      ctx.quadraticCurveTo(x + back * 10, neck - 2 + flow, x + back * (18 + Math.min(10, Math.abs(this.vx) / 25)), neck + 2 - flow);
      ctx.stroke();

      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6;
      // cabeza
      sCircle(ctx, x, headY, 9, s, 0.8, C.white);
      // ojo (mira hacia donde camina)
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.arc(x + this.facing * 3.5, headY - 1, 1.8, 0, Math.PI * 2); ctx.fill();
      // cuerpo
      sLine(ctx, x, neck, x, hip, s + 1, 0.8);
      // brazos
      let a1, a2;
      if (this.shootPose > 0) {
        a1 = [x + this.facing * 15, neck + 5];
        a2 = [x - this.facing * 7, neck + 13];
      } else if (!this.onGround) {
        a1 = [x + 9, neck - 4]; a2 = [x - 9, neck - 4];
      } else if (moving) {
        const sw = Math.sin(ph * Math.PI * 2) * 9;
        a1 = [x + sw, neck + 13]; a2 = [x - sw, neck + 13];
      } else {
        const br = Math.sin(t * 2.5) * 1;
        a1 = [x + 7, neck + 14 + br]; a2 = [x - 7, neck + 14 + br];
      }
      sLine(ctx, x, neck + 3, a1[0], a1[1], s + 2, 0.6);
      sLine(ctx, x, neck + 3, a2[0], a2[1], s + 3, 0.6);
      if (this.shootPose > 0) {
        // plumilla en la mano
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.moveTo(a1[0], a1[1] - 3); ctx.lineTo(a1[0] + this.facing * 8, a1[1]); ctx.lineTo(a1[0], a1[1] + 3);
        ctx.fill();
      }
      // piernas
      let l1, l2;
      if (!this.onGround) {
        l1 = [x + 6, foot - 4]; l2 = [x - 5, foot - 2];
      } else if (moving) {
        const sw = Math.sin(ph * Math.PI * 2) * 9;
        l1 = [x + sw, foot - Math.max(0, -Math.cos(ph * Math.PI * 2)) * 4];
        l2 = [x - sw, foot - Math.max(0, Math.cos(ph * Math.PI * 2)) * 4];
      } else {
        l1 = [x + 6, foot]; l2 = [x - 6, foot];
      }
      sLine(ctx, x, hip, l1[0], l1[1], s + 4, 0.6);
      sLine(ctx, x, hip, l2[0], l2[1], s + 5, 0.6);
    }
  }
  INK.Player = Player;

  /* ======================= ENEMIGOS ======================= */
  class Enemy {
    constructor(d) {
      this.type = d.type; this.min = d.min; this.max = d.max;
      this.vx = 0; this.vy = 0; this.dir = -1; this.flash = 0; this.alive = true;
      this.seed = Math.floor(Math.random() * 1000);
      this.t = Math.random() * 10; this.onGround = false;
    }
    get cx() { return this.x + this.w / 2; }
    contact(p, world) {
      if (!this.alive || !INK.overlap(this, p)) return;
      const stomp = p.vy > 60 && p.y + p.h - this.y < 16;
      if (stomp && this.stompable) {
        p.vy = -470; p.jumpCut = true; p.y = this.y - p.h - 1;
        this.onStomp(world);
      } else if (this.harmful()) {
        p.hurt(this.cx, world);
      }
    }
    harmful() { return true; }
    hitInk(world, shot) {
      this.hp -= 1; this.flash = 0.12;
      if (this.hp <= 0) this.die(world);
      else this.onHurt(world, shot);
    }
    onHurt() {}
    die(world) {
      this.alive = false;
      world.stats.erased++;
      INK.audio.play('erase');
      world.splash(this.cx, this.y + this.h / 2, this.type === 'borrador' ? C.eraser : C.ink, 16);
      world.decal(this.cx, this.y + this.h, 16);
      world.floatText(this.cx, this.y - 10, this.type === 'borrador' ? '¡Gastado!' : '¡Borrado!');
    }
  }

  // Garabato: trazo enmarañado que camina de un lado a otro.
  class Garabato extends Enemy {
    constructor(d, world) {
      super(d);
      this.w = 30; this.h = 30; this.hp = 1; this.stompable = true;
      this.x = d.x; this.y = world.groundY - this.h; this.speed = 55;
    }
    onStomp(world) { this.die(world); INK.audio.play('stun'); }
    update(dt, world) {
      this.t += dt; this.flash -= dt;
      this.vx = this.dir * this.speed;
      this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
      const oldVx = this.vx;
      world.moveBody(this, dt);
      const ahead = this.dir > 0 ? this.x + this.w + 3 : this.x - 3;
      if (this.vx === 0 && oldVx !== 0) this.dir *= -1;
      else if (this.onGround && !world.solidAt(ahead, this.y + this.h + 4)) this.dir *= -1;
      else if (this.x < this.min) this.dir = 1;
      else if (this.x + this.w > this.max) this.dir = -1;
      if (this.y > 700) this.alive = false;
    }
    draw(ctx) {
      const cx = this.cx, cy = this.y + this.h / 2 + Math.sin(this.t * 10) * 1.5;
      ctx.strokeStyle = this.flash > 0 ? C.blue : C.ink;
      ctx.lineWidth = 1.8;
      // maraña de trazos
      ctx.beginPath();
      for (let i = 0; i < 26; i++) {
        const a = i * 2.39 + this.t * 2.5;
        const r = 9 + wob(this.seed + i, 5);
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a * 1.3) * r * 0.9;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // ojos enfadados
      ctx.fillStyle = C.white;
      ctx.beginPath(); ctx.arc(cx - 5 + this.dir * 3, cy - 3, 4.5, 0, 7); ctx.arc(cx + 5 + this.dir * 3, cy - 3, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.arc(cx - 4 + this.dir * 4.5, cy - 2, 2, 0, 7); ctx.arc(cx + 6 + this.dir * 4.5, cy - 2, 2, 0, 7); ctx.fill();
      ctx.lineWidth = 1.6;
      sLine(ctx, cx - 9 + this.dir * 3, cy - 9, cx - 2 + this.dir * 3, cy - 6, this.seed + 40, 0.5);
      sLine(ctx, cx + 9 + this.dir * 3, cy - 9, cx + 2 + this.dir * 3, cy - 6, this.seed + 50, 0.5);
      // patitas
      const st = Math.sin(this.t * 14) * 4;
      sLine(ctx, cx - 5, this.y + this.h - 4, cx - 7 + st, this.y + this.h, this.seed + 60, 0.5);
      sLine(ctx, cx + 5, this.y + this.h - 4, cx + 7 - st, this.y + this.h, this.seed + 70, 0.5);
    }
  }

  // Garabato volador: un borrón con alas de trazo que patrulla en el aire.
  class Volador extends Enemy {
    constructor(d) {
      super(d);
      this.w = 30; this.h = 24; this.hp = 1; this.stompable = true;
      this.x = d.x; this.baseY = d.y; this.y = d.y; this.speed = 70;
    }
    onStomp(world) { this.die(world); INK.audio.play('stun'); }
    update(dt) {
      this.t += dt; this.flash -= dt;
      this.x += this.dir * this.speed * dt;
      if (this.x < this.min) { this.x = this.min; this.dir = 1; }
      if (this.x + this.w > this.max) { this.x = this.max - this.w; this.dir = -1; }
      this.y = this.baseY + Math.sin(this.t * 2.2) * 22;
    }
    draw(ctx) {
      const cx = this.cx, cy = this.y + this.h / 2;
      const flap = Math.sin(this.t * 16) * 9;
      ctx.strokeStyle = this.flash > 0 ? C.blue : C.ink; ctx.lineWidth = 2;
      sLine(ctx, cx - 6, cy - 2, cx - 22, cy - 6 - flap, this.seed, 0.8);
      sLine(ctx, cx + 6, cy - 2, cx + 22, cy - 6 - flap, this.seed + 9, 0.8);
      blob(ctx, cx, cy, 11, this.seed, C.ink, 7);
      ctx.fillStyle = C.white;
      ctx.beginPath(); ctx.arc(cx + this.dir * 4, cy - 2, 4, 0, 7); ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.arc(cx + this.dir * 5.5, cy - 2, 1.8, 0, 7); ctx.fill();
    }
  }

  // Borrador: goma de borrar que embiste y deja un rastro en blanco.
  class Borrador extends Enemy {
    constructor(d, world) {
      super(d);
      this.w = 52; this.h = 30; this.hp = 3; this.stompable = true;
      this.x = d.x; this.y = world.groundY - this.h;
      this.state = 'patrol'; this.st = 0; this.speed = 45;
    }
    harmful() { return this.state !== 'stun'; }
    onStomp(world) {
      this.state = 'stun'; this.st = 0.9; this.flash = 0.1;
      INK.audio.play('stun');
      world.splash(this.cx, this.y, C.eraser, 5);
    }
    onHurt(world, shot) {
      this.state = 'stun'; this.st = 0.65;
      this.knock = sign(shot.vx) * 160;
      INK.audio.play('stun');
      world.splash(this.cx, this.y + 8, C.eraser, 6);
    }
    update(dt, world) {
      this.t += dt; this.flash -= dt; this.st -= dt;
      const p = world.player;
      const dx = p.cx - this.cx, dy = p.y + p.h - (this.y + this.h);
      switch (this.state) {
        case 'patrol':
          this.vx = this.dir * this.speed;
          if (Math.abs(dx) < 290 && Math.abs(dy) < 70 && !p.dead && p.x > this.min - 140 && p.x < this.max + 140) {
            this.state = 'alert'; this.st = 0.5; this.dir = sign(dx) || 1;
            world.floatText(this.cx, this.y - 12, '!', C.red);
          }
          break;
        case 'alert':
          this.vx = 0;
          if (this.st <= 0) { this.state = 'charge'; this.st = 1.0; }
          break;
        case 'charge':
          this.vx = this.dir * 310;
          if (Math.random() < 0.6) world.crumb(this.x + (this.dir > 0 ? 0 : this.w), this.y + this.h - 3);
          if (this.st <= 0) { this.state = 'rest'; this.st = 0.9; }
          break;
        case 'rest':
          this.vx = 0;
          if (this.st <= 0) this.state = 'patrol';
          break;
        case 'stun':
          this.vx = this.knock || 0; this.knock = (this.knock || 0) * 0.85;
          if (this.st <= 0) { this.state = 'rest'; this.st = 0.3; this.knock = 0; }
          break;
      }
      this.vy = Math.min(this.vy + PHYS.gravity * dt, PHYS.maxFall);
      const want = this.vx;
      world.moveBody(this, dt);
      const ahead = this.dir > 0 ? this.x + this.w + 3 : this.x - 3;
      const blocked = this.vx === 0 && want !== 0;
      const edge = this.onGround && !world.solidAt(ahead, this.y + this.h + 4);
      if (this.state === 'patrol') {
        if (blocked || edge) this.dir *= -1;
        else if (this.x < this.min) this.dir = 1;
        else if (this.x + this.w > this.max) this.dir = -1;
      } else if (this.state === 'charge' && (blocked || edge)) {
        // frena en seco en el borde
        if (edge) this.x -= this.dir * 4;
        this.state = 'rest'; this.st = 0.9; world.shake(3);
      } else if (this.state === 'stun' && edge) {
        this.x -= sign(this.knock || 0) * 3; this.knock = 0;
      }
      if (this.y > 700) this.alive = false;
    }
    draw(ctx) {
      const shakeX = this.state === 'alert' ? wob(this.seed + INK.boil, 2.5) * 1.5 : 0;
      const x = this.x + shakeX, y = this.y, w = this.w, h = this.h;
      const squ = this.state === 'charge' ? 3 : 0;
      ctx.lineWidth = 2.2; ctx.strokeStyle = C.ink;
      // cuerpo rosa + franja azul (goma bicolor)
      ctx.fillStyle = this.flash > 0 ? C.white : C.eraser;
      ctx.fillRect(x, y + squ, w, h - squ);
      ctx.fillStyle = this.flash > 0 ? C.white : C.blueLight;
      const stripe = this.dir > 0 ? x : x + w * 0.62;
      ctx.fillRect(stripe, y + squ, w * 0.38, h - squ);
      sRect(ctx, x, y + squ, w, h - squ, this.seed, 1);
      // cara
      const fx = this.dir > 0 ? x + w * 0.58 : x + w * 0.1;
      ctx.fillStyle = C.ink;
      if (this.state === 'stun') {
        ctx.lineWidth = 1.8;
        sLine(ctx, fx + 2, y + 9, fx + 8, y + 15, this.seed + 3, 0.4); sLine(ctx, fx + 8, y + 9, fx + 2, y + 15, this.seed + 4, 0.4);
        sLine(ctx, fx + 12, y + 9, fx + 18, y + 15, this.seed + 5, 0.4); sLine(ctx, fx + 18, y + 9, fx + 12, y + 15, this.seed + 6, 0.4);
      } else {
        ctx.beginPath(); ctx.arc(fx + 6, y + 13 + squ, 2.6, 0, 7); ctx.arc(fx + 15, y + 13 + squ, 2.6, 0, 7); ctx.fill();
        ctx.lineWidth = 2;
        sLine(ctx, fx + 1, y + 6 + squ, fx + 9, y + 9 + squ, this.seed + 7, 0.4);
        sLine(ctx, fx + 20, y + 6 + squ, fx + 12, y + 9 + squ, this.seed + 8, 0.4);
      }
      // vida restante: muescas
      for (let i = 0; i < this.hp; i++) {
        ctx.fillStyle = C.eraserDark;
        ctx.fillRect(x + 6 + i * 7, y + h - 7, 4, 4);
      }
    }
  }

  INK.makeEnemy = (d, world) => {
    if (d.type === 'garabato') return new Garabato(d, world);
    if (d.type === 'volador') return new Volador(d, world);
    return new Borrador(d, world);
  };

  /* ======================= PROYECTIL DE TINTA ======================= */
  class Shot {
    constructor(x, y, dir, carry) {
      this.x = x; this.y = y; this.r = 7;
      this.vx = dir * 560 + carry * 0.25; this.vy = -70;
      this.life = 1.1; this.alive = true; this.seed = Math.floor(Math.random() * 999);
      this.trail = [];
    }
    get box() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
    update(dt, world) {
      this.trail.push([this.x, this.y]); if (this.trail.length > 5) this.trail.shift();
      this.vy += 380 * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.life -= dt;
      if (this.life <= 0) { this.alive = false; return; }
      if (world.solidAt(this.x, this.y)) {
        this.alive = false;
        INK.audio.play('splat');
        world.decal(this.x, this.y, 10);
        world.splash(this.x, this.y, C.blue, 6);
      }
    }
    draw(ctx) {
      ctx.strokeStyle = C.blueLight; ctx.lineWidth = 3; ctx.lineCap = 'round';
      if (this.trail.length > 1) {
        ctx.beginPath(); ctx.moveTo(this.trail[0][0], this.trail[0][1]);
        for (const [tx, ty] of this.trail) ctx.lineTo(tx, ty);
        ctx.stroke();
      }
      blob(ctx, this.x, this.y, this.r, this.seed + INK.boil, C.blue, 6);
    }
  }
  INK.Shot = Shot;

  /* ======================= GOTA DE TINTA (recarga) ======================= */
  class Pickup {
    constructor(d) { this.x = d.x; this.y = d.y; this.respawn = !!d.respawn; this.taken = false; this.timer = 0; this.t = Math.random() * 6; }
    get box() { return { x: this.x - 10, y: this.y - 14, w: 20, h: 26 }; }
    update(dt, world) {
      this.t += dt;
      if (this.taken) {
        if (this.respawn) { this.timer -= dt; if (this.timer <= 0) this.taken = false; }
        return;
      }
      const p = world.player;
      if (INK.overlap(this.box, p)) {
        this.taken = true; this.timer = 5;
        p.ink = Math.min(p.maxInk, p.ink + 3);
        INK.audio.play('pickup');
        world.splash(this.x, this.y, C.blue, 6);
        world.floatText(this.x, this.y - 22, '+3 tinta', C.blue);
      }
    }
    draw(ctx) {
      if (this.taken) return;
      const y = this.y + Math.sin(this.t * 3) * 4;
      ctx.fillStyle = C.blue; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(this.x, y - 14);
      ctx.bezierCurveTo(this.x + 4, y - 6, this.x + 10, y, this.x + 9, y + 5);
      ctx.arc(this.x, y + 4, 9, 0.1, Math.PI - 0.1);
      ctx.bezierCurveTo(this.x - 10, y, this.x - 4, y - 6, this.x, y - 14);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.ellipse(this.x - 3, y + 1, 2, 4, 0.4, 0, 7); ctx.fill();
    }
  }
  INK.Pickup = Pickup;

  /* ======================= PARTÍCULAS ======================= */
  INK.Particle = class {
    constructor(x, y, vx, vy, life, r, color, grav = 900, kind = 'dot') {
      Object.assign(this, { x, y, vx, vy, life, max: life, r, color, grav, kind });
      this.rot = rand(0, 6);
    }
    update(dt) {
      this.vy += this.grav * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      this.life -= dt; this.rot += dt * 6;
    }
    draw(ctx) {
      const k = Math.max(0, this.life / this.max);
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.fillStyle = this.color;
      if (this.kind === 'crumb') {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
        ctx.fillRect(-this.r, -this.r * 0.6, this.r * 2, this.r * 1.2); ctx.restore();
      } else if (this.kind === 'ring') {
        ctx.strokeStyle = this.color; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r * (1.6 - k), 0, 7); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r * (0.4 + k * 0.6), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  };
})();
