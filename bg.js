/* ==========================================================================
   bg.js: a self-contained, endlessly moving night-plaza panorama.
   Pixel-art style, drawn on a small canvas and scaled up. No network, no
   assets. Parallax layers drift past (skyline, cathedral with a ticking
   clock tower, houses, lamps, trees), with stars, a moon, clouds, fireflies,
   and a slow night -> dawn -> night colour cycle.

   Tweak the numbers in SETTINGS below.
   ========================================================================== */
(() => {
  'use strict';

  const canvas = document.getElementById('bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SETTINGS = {
    height: 216,        // internal pixel height (width follows the window shape)
    cycleSeconds: 150,  // one full night -> dawn -> night loop
    speedFar: 2.5,      // pixels per second for each parallax layer
    speedMid: 6,
    speedNear: 14,
    speedGround: 20,
    maxDawn: 0.9        // 0 = always night, 1 = full dawn at the peak of the cycle
  };

  const H = SETTINGS.height;
  let W = 384;

  /* ---------- small helpers ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const css = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
  const pmod = (n, m) => ((n % m) + m) % m;

  /* ---------- sky colours: [night, dawn] ---------- */
  const SKY = {
    top: [[5, 8, 26], [18, 28, 74]],
    mid: [[13, 21, 53], [86, 64, 120]],
    hor: [[27, 34, 80], [242, 164, 94]]
  };

  /* ---------- procedural layers ---------- */
  function makeLayer(o) {
    const mk = () => { const c = document.createElement('canvas'); c.width = o.LW; c.height = H; return c; };
    const night = mk(), dawn = mk();
    const gn = night.getContext('2d'), gd = dawn.getContext('2d');
    gn.fillStyle = o.night; gd.fillStyle = o.dawn;
    const fill = (x, y, w, h) => { gn.fillRect(x, y, w, h); gd.fillRect(x, y, w, h); };
    const c = { fill, r: rng(o.seed), windows: [], lamps: [], clocks: [], LW: o.LW, baseY: o.baseY };
    o.build(c);
    return { night, dawn, windows: c.windows, lamps: c.lamps, clocks: c.clocks, LW: o.LW, speed: o.speed };
  }

  function skyline(c, o) {
    const { fill, r, windows, LW, baseY } = c;
    let x = 0;
    while (x < LW) {
      let bw = Math.min(LW - x, Math.round(lerp(o.minW, o.maxW, r())));
      if (o.skip) {
        if (x >= o.skip[0] && x < o.skip[1]) { x = o.skip[1]; continue; }
        if (x < o.skip[0] && x + bw > o.skip[0]) bw = o.skip[0] - x;
      }
      const bh = Math.round(lerp(o.minH, o.maxH, r()));
      const top = baseY - bh;
      fill(x, top, bw, H - top);
      if (r() < o.gable) {
        for (let s = 1; s <= Math.min(7, Math.floor((bw - 2) / 4)); s++) fill(x + s * 2, top - s * 2, bw - s * 4, 2);
      } else if (r() < 0.5) {
        fill(x + 2, top - 3, Math.max(2, bw - 4), 3);
      }
      if (r() < 0.35 && bw > 8) fill(x + Math.round(bw * (0.2 + r() * 0.5)), top - (o.gable > 0.5 ? 12 : 7), 3, 8);
      if (o.windows) {
        for (let wy = top + 5; wy < baseY - 5; wy += 8) {
          for (let wx = x + 3; wx < x + bw - 4; wx += 6) {
            if (r() < o.windows) windows.push({ x: wx, y: wy, w: 2, h: 3, s: r() });
          }
        }
      }
      x += bw + (r() < 0.2 ? Math.round(lerp(1, 3, r())) : 0);
    }
  }

  function cathedral(c, x0) {
    const { fill, windows, clocks, r, baseY } = c;
    const NH = 40;
    fill(x0, baseY - NH, 132, H - (baseY - NH));
    for (let i = 4; i < 128; i += 10) { fill(x0 + i, baseY - NH - 6, 2, 6); fill(x0 + i, baseY - NH - 9, 1, 3); }

    const tower = (cx, w, h) => {
      const left = Math.round(cx - w / 2), top = baseY - h;
      fill(left, top, w, H - top);
      fill(left - 1, top - 3, w + 2, 3);
      for (let i = 0; i < w; i += 4) fill(left + i, top - 6, 2, 3);
      let sw = w - 2, y = top - 6;
      while (sw > 2) { fill(Math.round(cx - sw / 2), y - 4, sw, 4); y -= 4; sw -= 2; }
      fill(Math.round(cx), y - 6, 1, 6);
      for (let wy = top + 10; wy < baseY - 24; wy += 16) windows.push({ x: Math.round(cx) - 1, y: wy, w: 2, h: 6, s: r() });
      return top;
    };
    tower(x0 + 14, 16, 80);
    tower(x0 + 118, 16, 80);
    const mt = tower(x0 + 66, 20, 96);

    // tall nave windows
    for (let i = 8; i < 124; i += 12) {
      if ((i > 4 && i < 24) || (i > 56 && i < 78) || i > 108) continue;
      windows.push({ x: x0 + i, y: baseY - NH + 12, w: 2, h: 9, s: r() });
    }
    // clock, rose window and door glow
    clocks.push({ x: x0 + 62, y: mt + 14 });
    windows.push({ x: x0 + 63, y: mt + 30, w: 6, h: 6, s: 0.55, always: true, warm: true });
    windows.push({ x: x0 + 63, y: baseY - 14, w: 6, h: 14, s: 0.3, always: true, warm: true });
    windows.push({ x: x0 + 64, y: baseY - 16, w: 4, h: 2, s: 0.3, always: true, warm: true });
  }

  function props(c) {
    const { fill, r, lamps, LW, baseY } = c;
    for (let x = 18; x < LW - 20; x += Math.round(lerp(70, 115, r()))) {
      if (r() < 0.6) {
        fill(x, baseY - 36, 2, 36);
        fill(x - 2, baseY - 38, 6, 2);
        lamps.push({ x: x + 1, y: baseY - 40 });
      } else {
        fill(x, baseY - 14, 4, 14);
        fill(x - 8, baseY - 28, 20, 10);
        fill(x - 4, baseY - 38, 12, 10);
        fill(x - 1, baseY - 42, 6, 4);
      }
    }
  }

  const CATH_X = 190;
  const layerFar = makeLayer({
    seed: 11, LW: 480, baseY: Math.round(H * 0.68), speed: SETTINGS.speedFar, night: '#131b3f', dawn: '#5a4a7a',
    build: (c) => skyline(c, { minW: 10, maxW: 24, minH: 16, maxH: 52, gable: 0.4, windows: 0.12 })
  });
  const layerMid = makeLayer({
    seed: 23, LW: 520, baseY: Math.round(H * 0.78), speed: SETTINGS.speedMid, night: '#0d1433', dawn: '#3a2f58',
    build: (c) => {
      skyline(c, { minW: 12, maxW: 26, minH: 22, maxH: 50, gable: 0.7, windows: 0.4, skip: [CATH_X - 6, CATH_X + 138] });
      cathedral(c, CATH_X);
    }
  });
  const layerNear = makeLayer({
    seed: 37, LW: 420, baseY: Math.round(H * 0.88), speed: SETTINGS.speedNear, night: '#070b1d', dawn: '#1d1a33',
    build: (c) => { skyline(c, { minW: 14, maxW: 30, minH: 26, maxH: 54, gable: 0.8, windows: 0.5 }); props(c); }
  });

  const GY = Math.round(H * 0.9);
  const ground = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = H - GY;
    const g = c.getContext('2d'); const r = rng(77);
    g.fillStyle = '#04060e'; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(160,175,230,${0.03 + r() * 0.06})`;
      g.fillRect(Math.floor(r() * 252), Math.floor(r() * c.height), 4 + Math.floor(r() * 8), 2);
    }
    g.fillStyle = 'rgba(160,175,230,0.14)'; g.fillRect(0, 0, 256, 1);
    return c;
  })();

  const moon = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 14;
    const g = c.getContext('2d');
    for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
      const dx = x - 6.5, dy = y - 6.5;
      if (dx * dx + dy * dy <= 42) { g.fillStyle = '#eef3ff'; g.fillRect(x, y, 1, 1); }
    }
    g.fillStyle = '#c3cce6';
    [[3, 4, 3, 2], [8, 7, 3, 3], [5, 9, 2, 2]].forEach((q) => g.fillRect(q[0], q[1], q[2], q[3]));
    return c;
  })();

  /* ---------- scattered things ---------- */
  const rs = rng(5);
  const stars = Array.from({ length: 120 }, () => ({ fx: rs(), y: rs() * H * 0.55, big: rs() < 0.12, tw: 0.6 + rs() * 2, s: rs() * 10 }));
  const clouds = Array.from({ length: 7 }, () => ({ fx: rs(), y: 10 + rs() * H * 0.34, w: 40 + rs() * 50, sp: 1.5 + rs() * 3.5 }));
  const flies = Array.from({ length: 38 }, () => ({ fx: rs(), fy: rs(), vx: -(2 + rs() * 6), vy: 1 + rs() * 3, ph: rs() * 6.28, big: rs() < 0.2 }));

  /* ---------- drawing ---------- */
  function phaseAt(t) {
    const p = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / SETTINGS.cycleSeconds);
    return p * p * (3 - 2 * p) * SETTINGS.maxDawn;
  }

  function drawWindows(list, ox, t, ph) {
    const fade = 1 - ph * 0.7;
    for (const w of list) {
      const x = w.x + ox;
      if (x < -8 || x > W) continue;
      if (!w.always && Math.sin(t * (0.05 + w.s * 0.12) + w.s * 40) < -0.35) continue;
      ctx.globalAlpha = (0.72 + 0.28 * Math.sin(t * 3 + w.s * 20)) * fade;
      ctx.fillStyle = w.warm ? '#ffbf5e' : w.s > 0.85 ? '#a9d4ff' : '#ffd98a';
      ctx.fillRect(x, w.y, w.w, w.h);
    }
    ctx.globalAlpha = 1;
  }

  function drawLayer(L, t, ph) {
    const off = (t * L.speed) % L.LW;
    for (let x = -off; x < W; x += L.LW) {
      ctx.drawImage(L.night, x, 0);
      if (ph > 0.01) { ctx.globalAlpha = ph; ctx.drawImage(L.dawn, x, 0); ctx.globalAlpha = 1; }
      drawWindows(L.windows, x, t, ph);

      for (const lp of L.lamps) {
        const lx = lp.x + x;
        if (lx < -12 || lx > W + 12) continue;
        const f = 0.85 + 0.15 * Math.sin(t * 7 + lp.x);
        ctx.fillStyle = '#ffd37a';
        ctx.globalAlpha = 0.06 * f; ctx.fillRect(lx - 10, lp.y - 9, 22, 22);
        ctx.globalAlpha = 0.12 * f; ctx.fillRect(lx - 6, lp.y - 5, 14, 14);
        ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff1c4'; ctx.fillRect(lx - 1, lp.y, 3, 3);
      }
      ctx.globalAlpha = 1;

      for (const k of L.clocks) {
        const cx = k.x + x;
        if (cx < -12 || cx > W + 12) continue;
        ctx.fillStyle = '#ffe9a8'; ctx.globalAlpha = 0.95 * (1 - ph * 0.4); ctx.fillRect(cx, k.y, 8, 8);
        ctx.globalAlpha = 1; ctx.fillStyle = '#2a2410';
        const am = t * 0.105, ah = am / 12;
        for (let s = 1; s <= 3; s++) ctx.fillRect(cx + 4 + Math.round(Math.cos(am) * s), k.y + 4 + Math.round(Math.sin(am) * s), 1, 1);
        for (let s = 1; s <= 2; s++) ctx.fillRect(cx + 4 + Math.round(Math.cos(ah) * s), k.y + 4 + Math.round(Math.sin(ah) * s), 1, 1);
      }
    }
  }

  function render(t) {
    const ph = phaseAt(t);

    // sky
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.8);
    g.addColorStop(0, css(lerpC(SKY.top[0], SKY.top[1], ph)));
    g.addColorStop(0.55, css(lerpC(SKY.mid[0], SKY.mid[1], ph)));
    g.addColorStop(1, css(lerpC(SKY.hor[0], SKY.hor[1], ph)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    if (ph > 0.02) {
      const rg = ctx.createRadialGradient(W * 0.32, H * 0.7, 0, W * 0.32, H * 0.7, H * 0.8);
      rg.addColorStop(0, `rgba(255,196,120,${0.6 * ph})`);
      rg.addColorStop(1, 'rgba(255,196,120,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }

    // stars
    const starFade = 1 - ph * 1.15;
    if (starFade > 0) {
      ctx.fillStyle = '#ffffff';
      for (const s of stars) {
        const x = pmod(s.fx * W - t * 0.8, W);
        const a = (0.35 + 0.65 * Math.pow(Math.sin(t * s.tw + s.s), 2)) * starFade;
        ctx.globalAlpha = a;
        ctx.fillRect(x, s.y, s.big ? 2 : 1, s.big ? 2 : 1);
      }
      ctx.globalAlpha = 1;
    }

    // moon
    const mf = Math.max(0, 1 - ph * 1.25);
    if (mf > 0) {
      const mx = W * 0.78 - ph * W * 0.1, my = H * 0.17 + ph * H * 0.1;
      const mg = ctx.createRadialGradient(mx + 7, my + 7, 2, mx + 7, my + 7, 44);
      mg.addColorStop(0, `rgba(200,215,255,${0.28 * mf})`); mg.addColorStop(1, 'rgba(200,215,255,0)');
      ctx.fillStyle = mg; ctx.fillRect(mx - 40, my - 40, 94, 94);
      ctx.globalAlpha = mf; ctx.drawImage(moon, mx, my); ctx.globalAlpha = 1;
    }

    // clouds
    const cc = lerpC([60, 72, 140], [255, 175, 140], ph);
    ctx.fillStyle = css(cc, 0.32 + ph * 0.1);
    for (const c of clouds) {
      const x = pmod(c.fx * W + t * c.sp, W + c.w) - c.w;
      ctx.fillRect(x, c.y, c.w, 3);
      ctx.fillRect(x + c.w * 0.15, c.y - 3, c.w * 0.6, 3);
      ctx.fillRect(x + c.w * 0.3, c.y - 6, c.w * 0.3, 3);
      ctx.fillRect(x - c.w * 0.1, c.y + 3, c.w * 0.7, 2);
    }

    drawLayer(layerFar, t, ph);

    // mist between far and mid
    const fg1 = ctx.createLinearGradient(0, H * 0.55, 0, H * 0.82);
    fg1.addColorStop(0, 'rgba(150,175,235,0)');
    fg1.addColorStop(1, css(lerpC([130, 155, 225], [255, 190, 150], ph), 0.16));
    ctx.fillStyle = fg1; ctx.fillRect(0, H * 0.55, W, H * 0.3);

    drawLayer(layerMid, t, ph);
    drawLayer(layerNear, t, ph);

    // ground, scrolling a little faster than the near layer
    const goff = (t * SETTINGS.speedGround) % 256;
    for (let x = -goff; x < W; x += 256) ctx.drawImage(ground, x, GY);

    // fireflies
    for (const f of flies) {
      const x = pmod(f.fx * W + t * f.vx, W);
      const y = H * 0.45 + pmod(f.fy * H * 0.5 - t * f.vy, H * 0.5) + Math.sin(t * 0.6 + f.ph) * 4;
      const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 2 + f.ph));
      ctx.fillStyle = '#ffd37a';
      ctx.globalAlpha = a * 0.16; ctx.fillRect(x - 2, y - 2, 5, 5);
      ctx.globalAlpha = a * (1 - ph * 0.5); ctx.fillRect(x, y, f.big ? 2 : 1, f.big ? 2 : 1);
    }
    ctx.globalAlpha = 1;

    // low fog over the ground
    const fg2 = ctx.createLinearGradient(0, H * 0.78, 0, H);
    fg2.addColorStop(0, 'rgba(150,175,235,0)');
    fg2.addColorStop(1, css(lerpC([130, 155, 225], [255, 190, 150], ph), 0.2));
    ctx.fillStyle = fg2; ctx.fillRect(0, H * 0.78, W, H * 0.22);
  }

  /* ---------- sizing and loop ---------- */
  let raf = 0, last = 0, clock = reduceMotion ? 24 : 0;

  function resize() {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    W = Math.max(256, Math.min(900, Math.round(H * aspect)));
    canvas.width = W; canvas.height = H;
    ctx.imageSmoothingEnabled = true;
    if (!raf) render(clock);
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now; clock += dt;
    render(clock);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduceMotion || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  window.addEventListener('resize', resize);
  resize();
  start();

  window.BHBackground = { start, stop };
})();
