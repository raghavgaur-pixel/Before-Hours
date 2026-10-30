/* ==========================================================================
   scene.js: boot splash, splash text, and the OPTIONAL Sketchfab 3D scene.

   By default the page uses the built-in animated panorama from bg.js, which
   needs no network. To use the real 3D model "Plaza Night Time" by patrix
   (CC BY-SA 4.0) instead, open index.html?scene=3d, or set
   CONFIG.useSketchfab = true below. Use ?scene=3d&tune to get a camera tuner.
   ========================================================================== */
(() => {
  'use strict';

  const MODEL_UID = '282f497334f64a589edee4e63ad7e428';

  const CONFIG = {
    useSketchfab: false,    // true = load the 3D model by default
    upAxis: 'z',            // which axis points up in the viewer: 'x' | 'y' | 'z'
    radiusScale: 0.7,       // 1 = the model's default camera distance; smaller = closer
    heightScale: 1,         // scales the camera height above the target
    degPerSegment: 30,      // orbit step...
    secondsPerSegment: 10,  // ...taken over this long (full turn in 2 minutes)
    waypoints: [],          // optional hand-made path: [{ position:[x,y,z], target:[x,y,z], seconds:20 }, ...]
    minBootMs: 2600,        // minimum time the start-up splash stays on screen
    loadTimeoutMs: 25000    // give up on the 3D model after this long and keep the panorama
  };

  const params = new URLSearchParams(location.search);
  const mode = params.get('scene'); // 'off' | '3d' | null
  const use3D = mode === '3d' || (mode !== 'off' && CONFIG.useSketchfab);
  const tuning = use3D && params.has('tune');
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);

  try {
    const saved = JSON.parse(localStorage.getItem('bh.camera.v1') || 'null');
    if (saved && tuning) Object.assign(CONFIG, saved);
  } catch { /* ignore */ }

  /* ---------- Splash text (random, like a title screen) ---------- */
  const SPLASHES = [
    'Rise before the sun!', 'Cold morning, warm login!', 'Hacktoberfest 2026!', 'Also try the clock tower!',
    'Mind the cobblestones!', 'Open source, open gates!', 'The bells ring at dawn!', 'Contribute something!'
  ];
  $('splash').textContent = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];

  /* ---------- Boot splash ---------- */
  const fill = $('boot-fill');
  requestAnimationFrame(() => { fill.style.width = '82%'; });

  let sceneSettled;
  const sceneDone = new Promise((resolve) => { sceneSettled = resolve; });
  const minDelay = new Promise((resolve) => setTimeout(resolve, CONFIG.minBootMs));

  Promise.all([sceneDone, minDelay]).then(() => {
    fill.style.width = '100%';
    setTimeout(() => document.body.classList.remove('booting'), 450);
  });

  function fallback(reason) {
    console.info('[Before Hours] 3D scene unavailable, keeping the animated panorama:', reason);
    sceneSettled();
  }

  // Default: the animated panorama is the background, nothing else to load.
  if (!use3D) { sceneSettled(); return; }

  /* ---------- Optional Sketchfab viewer ---------- */
  const script = document.createElement('script');
  script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
  script.onload = initViewer;
  script.onerror = () => fallback('viewer script did not load');
  document.head.appendChild(script);

  function initViewer() {
    if (typeof window.Sketchfab !== 'function') { fallback('viewer script missing'); return; }
    const iframe = $('scene');
    const client = new window.Sketchfab(iframe);
    const timeout = setTimeout(() => fallback('timed out'), CONFIG.loadTimeoutMs);

    client.init(MODEL_UID, {
      autostart: 1,
      preload: 1,
      dnt: 1,
      ui_controls: 0, ui_infos: 0, ui_stop: 0, ui_annotations: 0, ui_help: 0, ui_hint: 0,
      ui_settings: 0, ui_inspector: 0, ui_vr: 0, ui_ar: 0, ui_fullscreen: 0, ui_loading: 0,
      success: (api) => {
        api.start();
        api.addEventListener('viewerready', () => {
          clearTimeout(timeout);
          iframe.classList.add('ready');
          document.body.classList.add('has-3d');
          // the 3D scene now covers the panorama; stop drawing it to save power
          setTimeout(() => { if (window.BHBackground) window.BHBackground.stop(); }, 2600);
          sceneSettled();
          startCamera(api);
          if (tuning) startTuner(api);
        });
      },
      error: () => { clearTimeout(timeout); fallback('viewer init error'); }
    });
  }

  /* ---------- Camera ---------- */
  const AXIS = { x: 0, y: 1, z: 2 };
  let runId = 0;

  function startCamera(api) {
    if (reduceMotion) return;
    const id = ++runId;

    api.setCameraEasing('linear', () => {});

    if (CONFIG.waypoints.length) {
      let i = 0;
      const next = () => {
        if (id !== runId) return;
        const w = CONFIG.waypoints[i++ % CONFIG.waypoints.length];
        api.setCameraLookAt(w.position, w.target, w.seconds || 20, next);
      };
      next();
      return;
    }

    api.getCameraLookAt((err, cam) => {
      if (err || !cam) return;
      const target = cam.target.slice();
      const up = AXIS[CONFIG.upAxis] ?? 2;
      const [a, b] = [0, 1, 2].filter((k) => k !== up);
      const d = cam.position.map((v, k) => v - target[k]);
      const r = (Math.hypot(d[a], d[b]) || 1) * CONFIG.radiusScale;
      const h = d[up] * CONFIG.heightScale;
      let theta = Math.atan2(d[b], d[a]);
      const stepRad = (CONFIG.degPerSegment * Math.PI) / 180;

      const place = (t) => {
        const p = target.slice();
        p[a] = target[a] + r * Math.cos(t);
        p[b] = target[b] + r * Math.sin(t);
        p[up] = target[up] + h;
        return p;
      };

      const step = () => {
        if (id !== runId) return;
        theta += stepRad;
        api.setCameraLookAt(place(theta), target, CONFIG.secondsPerSegment, step);
      };

      api.setCameraLookAt(place(theta), target, 1.5, () => {
        api.setCameraEasing('linear', () => {});
        step();
      });
    });
  }

  /* ---------- Tuner (?scene=3d&tune) ---------- */
  function startTuner(api) {
    const panel = $('tune');
    panel.hidden = false;
    $('tune-up').value = CONFIG.upAxis;
    $('tune-radius').value = CONFIG.radiusScale;
    $('tune-height').value = CONFIG.heightScale;

    const save = () => {
      try {
        localStorage.setItem('bh.camera.v1', JSON.stringify({
          upAxis: CONFIG.upAxis, radiusScale: CONFIG.radiusScale, heightScale: CONFIG.heightScale
        }));
      } catch { /* ignore */ }
    };
    const restart = () => { save(); startCamera(api); };

    $('tune-up').addEventListener('change', (e) => { CONFIG.upAxis = e.target.value; restart(); });
    $('tune-radius').addEventListener('change', (e) => { CONFIG.radiusScale = parseFloat(e.target.value); restart(); });
    $('tune-height').addEventListener('change', (e) => { CONFIG.heightScale = parseFloat(e.target.value); restart(); });

    let latest = null;
    setInterval(() => {
      api.getCameraLookAt((err, cam) => {
        if (err || !cam) return;
        const r = (arr) => arr.map((n) => Math.round(n * 100) / 100);
        latest = { position: r(cam.position), target: r(cam.target), seconds: 20 };
        $('tune-out').textContent = JSON.stringify(latest);
      });
    }, 500);

    $('tune-copy').addEventListener('click', () => {
      if (!latest) return;
      const text = JSON.stringify(latest);
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
        () => { $('tune-copy').textContent = 'Copied'; },
        () => { $('tune-copy').textContent = 'Select the text above'; }
      );
      setTimeout(() => { $('tune-copy').textContent = 'Copy camera JSON'; }, 1500);
    });
  }
})();
