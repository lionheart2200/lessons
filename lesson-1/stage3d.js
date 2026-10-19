/* Stage3D — النواة: مُصيِّر WebGL واحد مشترك يرسم كل المشاهد ثم ينسخها إلى لوحات 2D
   (أخف على الجوال/WebView). الوحدات الأخرى: char3d.js (الشخصيات) و world3d.js (العالم). */
(() => {
"use strict";
const T = window.THREE;
if (!T) { window.Stage3D = { ok: false }; return; }
let renderer;
try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); if (!renderer.getContext()) throw 0; }
catch (e) { window.Stage3D = { ok: false }; return; }
renderer.setClearColor(0x000000, 0);
renderer.setScissorTest(true);
renderer.domElement.addEventListener("webglcontextlost", e => e.preventDefault());
T.Cache.enabled = true;

const RM = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
const lib = {
  PI: Math.PI,
  lam: (c, o) => new T.MeshLambertMaterial(Object.assign({ color: c }, o)),
  phong: (c, o) => new T.MeshPhongMaterial(Object.assign({ color: c, shininess: 40, specular: 0x333333 }, o)),
  basic: (c, o) => new T.MeshBasicMaterial(Object.assign({ color: c }, o)),
  mk: (tr, geo, mat, par) => { const m = new T.Mesh(geo, mat); tr.push(geo, mat); if (par) par.add(m); return m; },
  free: tr => { tr.forEach(o => o.dispose && o.dispose()); tr.length = 0; },
  tex: (w, h, draw, o) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); return Object.assign(t, o || {}); },
  easeOut: u => 1 - Math.pow(1 - u, 3),
  easeIn: u => u * u * u,
  easeInOut: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
  backOut: u => 1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2),
  lerp: (a, b, k) => a + (b - a) * k,
  c01: v => Math.max(0, Math.min(1, v)),
  reduced: () => RM.matches || document.body.classList.contains("still")
};
lib.glow = lib.tex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.35, "rgba(255,255,255,.4)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
/* هالة مضيئة (Sprite) بلون وحجم */
lib.halo = (color, size, opacity) => { const s = new T.Sprite(new T.SpriteMaterial({ map: lib.glow, color, transparent: true, opacity: opacity == null ? 1 : opacity, blending: T.AdditiveBlending, depthWrite: false })); s.scale.set(size, size, 1); return s; };

const handles = new Set();
let dpr = Math.min(window.devicePixelRatio || 1, 1.25), RW = 0, RH = 0, last = 0, on = false, gapEma = 33, prevN = 0, gap = 30;
function add(h) {
  h.vis = true;
  if ("IntersectionObserver" in window) { h.io = new IntersectionObserver(e => { h.vis = e[e.length - 1].isIntersecting; }); h.io.observe(h.canvas); }
  handles.add(h); if (!on) { on = true; requestAnimationFrame(loop); }
  return h;
}
function drop(h) { h.dead = true; handles.delete(h); h.io && h.io.disconnect(); }
function loop(ts) {
  requestAnimationFrame(loop);
  if (document.hidden || ts - last < gap) return;
  const real = ts - last, dt = Math.min(.1, real / 1000 || .033); last = ts;
  let n = 0;
  handles.forEach(h => {
    if (h.dead || !h.vis || !h.canvas.isConnected) return;
    const cw = h.canvas.clientWidth, ch = h.canvas.clientHeight; if (!cw || !ch) return;
    const w = Math.max(1, Math.round(cw * dpr)), hh = Math.max(1, Math.round(ch * dpr));
    if (h.canvas.width !== w || h.canvas.height !== hh) { h.canvas.width = w; h.canvas.height = hh; h.fit(w / hh, hh); }
    if (w > RW || hh > RH) { RW = Math.max(RW, w); RH = Math.max(RH, hh); renderer.setSize(RW, RH, false); }
    h.update(dt);
    renderer.setViewport(0, 0, w, hh); renderer.setScissor(0, 0, w, hh); renderer.render(h.scene, h.cam);
    h.ctx.clearRect(0, 0, w, hh); h.ctx.drawImage(renderer.domElement, 0, RH - hh, w, hh, 0, 0, w, hh); n++;
  });
  /* تكيّف تلقائي: إذا تأخرت الإطارات نخفّض الدقة ثم معدل الإطارات */
  if (n && prevN) { gapEma = gapEma * .88 + real * .12;
    if (gapEma > 56) { if (dpr > 1) dpr = 1; else if (dpr > .75) dpr = .75; else gap = 45; gapEma = 33; } }
  prevN = n;
}

window.Stage3D = { ok: true, T, lib, add, drop, handles };
})();
