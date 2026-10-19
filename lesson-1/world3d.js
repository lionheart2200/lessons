/* world3d — عالم المغامرة: سلسلة جزر عائمة في سماء كونية، مسارا فريقين، وخطر يطارد كل فريق
   الواجهة:  Stage3D.createWorld(canvas, {players, scene, steps, models}) -> W
   W: setPlayer(i,p,url) · setSafety(i,0..100) · setActive(i,bool) · react(i,"cheer|sad|shy") · advance(i)->Promise
      strike(i)->Promise · finale(win: 0|1|-1) · skip() · destroy()    ·  W.onsfx(name) لأصوات الأحداث */
(() => {
"use strict";
const S = window.Stage3D; if (!S || !S.ok || !S.makeActor) return;
const T = S.T, L = S.lib, PI = Math.PI;
const { lam, phong, basic, mk, free, tex, easeOut, easeIn, easeInOut, lerp, c01 } = L;
const SP = 3.8, IR = 1.45, LZ = [3.3, -3.3], xOf = k => -SP * k;
const rnd = seed => () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

/* ---------- خامات مرسومة برمجيًا ---------- */
const skyTex = tex(4, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h);
  [[0, "#060320"], [.2, "#1a0c52"], [.38, "#52208e"], [.46, "#c8468a"], [.5, "#ff9a5a"], [.54, "#c8468a"], [.64, "#47197a"], [1, "#0c0528"]].forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
const scaleTex = tex(128, 256, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, w, 0);
  [[0, "#0b3d3a"], [.2, "#1b7a63"], [.38, "#6fb86a"], [.5, "#efe3b5"], [.62, "#6fb86a"], [.8, "#1b7a63"], [1, "#0b3d3a"]].forEach(([o, c]) => g.addColorStop(o, c));
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let j = 0; j < 20; j++) for (let i = -1; i < 10; i++) {
    const cx = i * 14 + (j % 2) * 7, cy = j * 13 + 8;
    x.strokeStyle = "rgba(0,20,15,.35)"; x.lineWidth = 1.6; x.beginPath(); x.arc(cx, cy, 8.5, .15 * PI, .85 * PI); x.stroke();
    x.strokeStyle = "rgba(255,255,230,.16)"; x.beginPath(); x.arc(cx, cy - 2, 7, 1.1 * PI, 1.9 * PI); x.stroke();
  }
  [0, w].forEach(ex => { for (let j = 0; j < 4; j++) { const cy = 32 + j * 64; x.fillStyle = "#ffc93c"; x.strokeStyle = "#3a2a00"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(ex - 15, cy); x.lineTo(ex, cy - 26); x.lineTo(ex + 15, cy); x.lineTo(ex, cy + 26); x.closePath(); x.fill(); x.stroke(); } });
}, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
const runeTex = tex(128, 128, x => { x.strokeStyle = "#fff"; x.lineWidth = 4; x.beginPath(); x.arc(64, 64, 58, 0, PI * 2); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(64, 64, 44, 0, PI * 2); x.stroke();
  x.lineWidth = 3; x.beginPath(); for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * PI * 4 / 5; x[i ? "lineTo" : "moveTo"](64 + Math.cos(a) * 40, 64 + Math.sin(a) * 40); } x.closePath(); x.stroke();
  for (let i = 0; i < 12; i++) { const a = i * PI / 6; x.beginPath(); x.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); x.lineTo(64 + Math.cos(a) * 56, 64 + Math.sin(a) * 56); x.stroke(); } });
const swirlTex = tex(256, 256, x => { const g = x.createRadialGradient(128, 128, 5, 128, 128, 128); g.addColorStop(0, "#fff"); g.addColorStop(.4, "#7ef0ff"); g.addColorStop(.75, "#8a4dff"); g.addColorStop(1, "rgba(80,20,160,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = 5; for (let k = 0; k < 4; k++) { x.beginPath(); for (let a = 0; a < 6.5; a += .1) { const r = 8 + a * 17, th = a + k * PI / 2; x[a ? "lineTo" : "moveTo"](128 + Math.cos(th) * r, 128 + Math.sin(th) * r); } x.stroke(); } });
const planetTex = tex(256, 128, (x, w, h) => { const cs = ["#f4b36a", "#d9825a", "#f7d9a0", "#b8604a", "#e8a070"]; for (let i = 0; i < 14; i++) { x.fillStyle = cs[i % 5]; x.fillRect(0, i * h / 14, w, h / 14 + 1); } });
const auroraTex = tex(8, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(80,255,200,0)"); g.addColorStop(.45, "rgba(90,255,190,.55)"); g.addColorStop(.7, "rgba(160,90,255,.35)"); g.addColorStop(1, "rgba(160,90,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); });
const lavaTex = tex(128, 128, (x, w, h) => { x.fillStyle = "#2a1820"; x.fillRect(0, 0, w, h); x.strokeStyle = "#ff8a1a"; x.lineWidth = 3; const r = rnd(7);
  for (let k = 0; k < 14; k++) { x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let s = 0; s < 5; s++) { px += (r() - .5) * 50; py += (r() - .5) * 50; x.lineTo(px, py); } x.stroke(); } });

const gooTex = tex(128, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#3fe01c"); g.addColorStop(1, "#b6ff4a"); x.fillStyle = g; x.fillRect(0, 0, w, h); const r = rnd(5);
  for (let i = 0; i < 26; i++) { x.fillStyle = "rgba(235,255,170," + (.25 + r() * .3) + ")"; x.beginPath(); x.arc(r() * w, r() * h, 3 + r() * 9, 0, PI * 2); x.fill(); } }, { wrapS: T.RepeatWrapping, wrapT: T.RepeatWrapping });
/* ---------- جسيمات (نقاط مضيئة بسعة ٢٤٠) ---------- */
function makeParticles(scene, tr) {
  const N = 240, geo = new T.BufferGeometry(), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N), alp = new Float32Array(N);
  const st = Array.from({ length: N }, () => ({ vx: 0, vy: 0, vz: 0, life: 0, max: 1, s0: 1, g: 0 }));
  [["position", pos, 3], ["color", col, 3], ["aSize", siz, 1], ["aAlpha", alp, 1]].forEach(([n, a, k]) => geo.setAttribute(n, new T.BufferAttribute(a, k).setUsage(T.DynamicDrawUsage)));
  const mat = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, vertexColors: true, uniforms: { uScale: { value: 300 } },
    vertexShader: "attribute float aSize; attribute float aAlpha; varying vec3 vC; varying float vA; uniform float uScale; void main(){ vC=color; vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=aSize*uScale/max(-mv.z,.1); gl_Position=projectionMatrix*mv; }",
    fragmentShader: "varying vec3 vC; varying float vA; void main(){ float d=length(gl_PointCoord-vec2(.5)); float a=smoothstep(.5,.0,d)*vA; gl_FragColor=vec4(vC,a); }" });
  const pts = new T.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); tr.push(geo, mat); let next = 0; const cc = new T.Color();
  return {
    mat,
    emit(x, y, z, n, o) {
      o = o || {};
      for (let k = 0; k < n; k++) {
        const i = next = (next + 1) % N, p = st[i], a = Math.random() * PI * 2, b = (Math.random() - .35) * PI * .9, sp = (o.sp || 4) * (.4 + Math.random() * .8);
        p.vx = Math.cos(b) * Math.cos(a) * sp; p.vy = Math.sin(b) * sp + (o.up || 0); p.vz = Math.cos(b) * Math.sin(a) * sp; p.life = p.max = (o.life || 1) * (.6 + Math.random() * .6); p.s0 = (o.size || .5) * (.6 + Math.random() * .7); p.g = o.g == null ? 6 : o.g;
        cc.set(Array.isArray(o.col) ? o.col[(Math.random() * o.col.length) | 0] : (o.col || 0xffffff)); pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
      }
    },
    update(dt) {
      for (let i = 0; i < N; i++) { const p = st[i]; if (p.life <= 0) { alp[i] = 0; siz[i] = 0; continue; } p.life -= dt; p.vy -= p.g * dt;
        pos[i * 3] += p.vx * dt; pos[i * 3 + 1] += p.vy * dt; pos[i * 3 + 2] += p.vz * dt; const k = c01(p.life / p.max); alp[i] = k; siz[i] = p.s0 * (.4 + .6 * k); }
      ["position", "color", "aSize", "aAlpha"].forEach(n => { geo.attributes[n].needsUpdate = true; });
    }
  };
}

/* ---------- الجزر ---------- */
function makeIsland(tr, team, big, r0) {
  const g = new T.Group(), r = r0 || (big ? 1.9 : IR), grass = new T.Color(0x57d6a2).lerp(team, .22), R = rnd(Math.floor(r * 1000) + 3);
  const top = mk(tr, new T.CylinderGeometry(r, r * .9, .45, 28), phong(grass, { shininess: 25, specular: 0x224433 }), g); top.position.y = -.225;
  const rim = mk(tr, new T.TorusGeometry(r * .98, .06, 6, 44), basic(team), g); rim.rotation.x = PI / 2; rim.position.y = .0;
  const rune = mk(tr, new T.CircleGeometry(r * .78, 36), basic(team, { map: runeTex, transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false }), g); rune.rotation.x = -PI / 2; rune.position.y = .014;
  const rock = mk(tr, new T.ConeGeometry(r * .9, r * 1.9, 8, 1), lam(0x5b3f6e, { flatShading: true }), g); rock.rotation.x = PI; rock.position.y = -.45 - r * .95;
  for (let k = 0; k < 3; k++) { const s = mk(tr, new T.DodecahedronGeometry(.18 + R() * .22, 0), lam(0x6d4c80, { flatShading: true }), g); const a = R() * PI * 2; s.position.set(Math.cos(a) * r * .55, -.9 - R() * 1.2, Math.sin(a) * r * .55); }
  const cm = lam(0x7ff2ff, { emissive: 0x2a8aa8, flatShading: true });
  for (let k = 0; k < (big ? 4 : 2); k++) { const c = mk(tr, new T.ConeGeometry(.1 + R() * .08, .45 + R() * .4, 5), cm, g); const a = R() * PI * 2, rr = r * (.62 + R() * .25); c.position.set(Math.cos(a) * rr, .25, Math.sin(a) * rr); c.rotation.z = (R() - .5) * .4; }
  return { g, top, rim, rune, lit: 0 };
}

/* ---------- الثعبان السماوي (أنبوب متحرك + رأس مفصّل) ---------- */
function makeSnake(tr) {
  const N = 62, Mv = 14, LEN = 15.5, DS = LEN / (N - 1), g = new T.Group();
  const pos = new Float32Array(N * (Mv + 1) * 3), nor = new Float32Array(N * (Mv + 1) * 3), uv = new Float32Array(N * (Mv + 1) * 2), idx = [];
  for (let i = 0; i < N; i++) for (let j = 0; j <= Mv; j++) { const k = (i * (Mv + 1) + j) * 2; uv[k] = j / Mv; uv[k + 1] = i * DS / 2.2; }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < Mv; j++) { const a = i * (Mv + 1) + j, b = a + 1, c = a + Mv + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage)); geo.setAttribute("normal", new T.BufferAttribute(nor, 3).setUsage(T.DynamicDrawUsage)); geo.setAttribute("uv", new T.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const mat = new T.MeshPhongMaterial({ map: scaleTex, shininess: 90, specular: 0x99ffdd, side: T.DoubleSide });
  const body = new T.Mesh(geo, mat); body.frustumCulled = false; g.add(body); tr.push(geo, mat);
  /* الرأس */
  const head = new T.Group(); g.add(head);
  const hm = new T.MeshPhongMaterial({ color: 0x1f8f6c, shininess: 90, specular: 0xaaffe0 }), hl = new T.MeshPhongMaterial({ color: 0xefe3b5, shininess: 60 }), dm = lam(0x2a0a10), eyeM = new T.MeshPhongMaterial({ color: 0xffb81c, emissive: 0xcc6a00, shininess: 120 }), pupM = basic(0x050505);
  tr.push(hm, hl, dm, eyeM, pupM);
  const part = (geom, m, par) => { const x = new T.Mesh(geom, m); tr.push(geom); (par || head).add(x); return x; };
  const skull = part(new T.SphereGeometry(.34, 18, 14), hm); skull.scale.set(1.05, .72, 1.45); skull.position.set(0, .02, .08);
  const snout = part(new T.SphereGeometry(.24, 16, 12), hm); snout.scale.set(.95, .62, 1.35); snout.position.set(0, -.02, .5);
  const palate = part(new T.SphereGeometry(.22, 12, 10), hl); palate.scale.set(.9, .32, 1.3); palate.position.set(0, -.11, .48);
  [-1, 1].forEach(s => {
    const ey = part(new T.SphereGeometry(.105, 14, 12), eyeM); ey.position.set(s * .24, .1, .3);
    const pu = part(new T.BoxGeometry(.028, .15, .03), pupM); pu.position.set(s * .31, .1, .35); pu.rotation.y = -s * .6;
    const br = part(new T.BoxGeometry(.2, .05, .12), hm); br.position.set(s * .22, .2, .3); br.rotation.z = -s * .45; br.rotation.y = s * .25;
    part(new T.SphereGeometry(.03, 8, 6), pupM).position.set(s * .07, .03, .78);
  });
  const jawP = new T.Group(); jawP.position.set(0, -.1, .08); head.add(jawP);
  const jaw = part(new T.SphereGeometry(.22, 14, 10), hl, jawP); jaw.scale.set(.95, .38, 1.55); jaw.position.set(0, -.05, .34);
  const mouthIn = part(new T.SphereGeometry(.18, 10, 8), dm, jawP); mouthIn.scale.set(.85, .25, 1.3); mouthIn.position.set(0, .0, .36);
  const fang = lam(0xffffff); tr.push(fang);
  [-1, 1].forEach(s => { const f = part(new T.ConeGeometry(.032, .16, 6), fang, head); f.position.set(s * .1, -.17, .66); f.rotation.x = PI; });
  const tongue = new T.Group(); tongue.position.set(0, -.08, .66); jawP.add(tongue);
  const tm = lam(0xe0203c, { emissive: 0x500010 }); tr.push(tm);
  const tb = part(new T.BoxGeometry(.035, .018, .5), tm, tongue); tb.position.z = .25;
  [-1, 1].forEach(s => { const f = part(new T.BoxGeometry(.03, .016, .2), tm, tongue); f.position.set(s * .05, 0, .55); f.rotation.y = s * .35; });
  const P = Array.from({ length: N }, () => new T.Vector3()), Tn = new T.Vector3(), Nn = new T.Vector3(), Bn = new T.Vector3(), ZA = new T.Vector3(0, 0, 1), UP = new T.Vector3(0, 1, 0), fwd = new T.Vector3(), rt = new T.Vector3(), up2 = new T.Vector3(), mtx = new T.Matrix4();
  return {
    g,
    update(t, hx, z, y, rise, hood, mouth) {
      for (let i = 0; i < N; i++) {
        const s = i * DS, env = Math.min(1, s / 2.6), ph = 1.55 * s - 2.4 * t;
        P[i].set(hx + s - rise * .5 * Math.pow(Math.max(0, 1 - s / 2.8), 2), y + .22 * Math.sin(ph + 1.2) * env + rise * 1.5 * Math.pow(Math.max(0, 1 - s / 3.2), 1.6), z + .6 * Math.sin(ph) * env);
      }
      for (let i = 0; i < N; i++) {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)];
        Tn.subVectors(a, b).normalize(); Nn.crossVectors(Tn, ZA).normalize(); Bn.crossVectors(Nn, Tn).normalize();
        const s = i * DS, tp = c01((s - 2.5) / (LEN - 2.5)); let rN = s < 2.5 ? lerp(.26, .34, s / 2.5) : .34 * (1 - Math.pow(tp, 1.5)); rN = Math.max(rN, .045);
        const hd = hood * Math.exp(-Math.pow((s - 1.25) / .8, 2)), rB = rN * (1 + hd * 1.9), rN2 = rN * (1 - hd * .22);
        for (let j = 0; j <= Mv; j++) {
          const th = PI * 2 * j / Mv, c = Math.cos(th), sn = Math.sin(th), k = (i * (Mv + 1) + j) * 3;
          pos[k] = P[i].x + Nn.x * c * rN2 + Bn.x * sn * rB; pos[k + 1] = P[i].y + Nn.y * c * rN2 + Bn.y * sn * rB; pos[k + 2] = P[i].z + Nn.z * c * rN2 + Bn.z * sn * rB;
          nor[k] = Nn.x * c + Bn.x * sn; nor[k + 1] = Nn.y * c + Bn.y * sn; nor[k + 2] = Nn.z * c + Bn.z * sn;
        }
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true;
      head.position.copy(P[0]); fwd.subVectors(P[0], P[2]).normalize(); rt.crossVectors(UP, fwd).normalize(); up2.crossVectors(fwd, rt).normalize();
      mtx.makeBasis(rt, up2, fwd); head.quaternion.setFromRotationMatrix(mtx);
      jawP.rotation.x = mouth * .75; tongue.scale.z = .5 + Math.abs(Math.sin(t * 9)) * .7; tongue.rotation.y = Math.sin(t * 13) * .18; tongue.visible = mouth > .05 || Math.sin(t * 2) > -.3;
    }
  };
}
/* ---------- النيزك الناري ---------- */
function makeMeteor(tr) {
  const g = new T.Group(), geo = new T.IcosahedronGeometry(1.05, 2), p = geo.attributes.position, R = rnd(11);
  for (let i = 0; i < p.count; i++) { const k = .82 + R() * .36; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } geo.computeVertexNormals();
  const core = mk(tr, geo, phong(0x3a2a34, { emissive: 0x7a2200, flatShading: true, map: lavaTex, shininess: 20 }), g);
  const halo = L.halo(0xff7a1a, 5.5, .8); g.add(halo); const trail = [];
  for (let i = 0; i < 14; i++) { const s = L.halo(i % 3 ? 0xff7a1a : 0xffd24a, 3.2 - i * .17, .7 - i * .04); g.add(s); trail.push(s); }
  return { g, update(t, hx, z, y, rise) { g.position.set(hx, y + .5 + rise * .6, z); core.rotation.set(t * 1.3, t * .9, 0); halo.material.opacity = .65 + Math.sin(t * 9) * .15;
    trail.forEach((s, i) => { s.position.set((i + 1) * .62, Math.sin(t * 8 + i) * .12, Math.cos(t * 7 + i) * .12); }); } };
}
/* ---------- موجة اللزوجة النيون ---------- */
function makeGoo(tr) {
  const g = new T.Group(), gm = phong(0x58ff2a, { emissive: 0x1d7a10, shininess: 90, specular: 0xccffaa }), blobs = [];
  for (let i = 0; i < 9; i++) { const b = mk(tr, new T.SphereGeometry(.55 + (i % 3) * .14, 14, 10), gm, g); b.userData.z = -1.9 + i * .475; b.userData.ph = i * .8; blobs.push(b); }
  const fl = mk(tr, new T.PlaneGeometry(26, 5.4), basic(0xffffff, { map: gooTex, transparent: true, opacity: .92 }), g); fl.rotation.x = -PI / 2; fl.position.set(13.5, -.9, 0);
  const halo = L.halo(0x66ff33, 6, .45); g.add(halo);
  return { g, update(t, hx, z, y, rise) { g.position.set(hx, 0, z); const hgt = .5 + rise * .9;
    blobs.forEach(b => { const w = Math.sin(t * 2.4 + b.userData.ph); b.position.set(w * .25, -.5 + hgt * .5 + w * .12, b.userData.z); b.scale.set(1, hgt * (1.1 + w * .12), 1); });
    fl.material.map.offset.x = (t * .05) % 1; halo.position.set(0, hgt, 0); } };
}

/* ---------- العالم ---------- */
S.createWorld = function (canvas, o) {
  const W = { canvas, ctx: canvas.getContext("2d"), scene: new T.Scene(), cam: new T.PerspectiveCamera(44, 1.6, .1, 700), dead: false, time: 0, tr: [], steps: Math.max(1, o.steps || 6), kind: o.scene || "snake",
    lanes: [], tasks: [], calm: false, fin: null, onsfx: null, kick: 0, asp: 1.6, hh: 400 }, sc = W.scene, tr = W.tr, sfx = n => { W.onsfx && W.onsfx(n); };
  sc.fog = new T.Fog(0x3d1c70, 40, 130);
  sc.add(new T.AmbientLight(0xb8a8ff, .62), new T.HemisphereLight(0x8fa8ff, 0x7a2a7a, .55));
  const sun = new T.DirectionalLight(0xffe0c0, 1.05); sun.position.set(-12, 16, 12); sc.add(sun);
  const PS = makeParticles(sc, tr); W.ps = PS;
  /* ===== السماء والخلفيات ===== */
  const bgFar = new T.Group(), bgMid = new T.Group(), bgNear = new T.Group(); sc.add(bgFar, bgMid, bgNear);
  const sky = mk(tr, new T.SphereGeometry(320, 24, 16), basic(0xffffff, { map: skyTex, side: T.BackSide, fog: false, depthWrite: false }), bgFar); sky.renderOrder = -10;
  const R = rnd(42);
  { const n = 380, pa = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = R() * PI * 2, b = (R() * .9 - .1) * PI / 2 + .25, r = 290; pa[i * 3] = Math.cos(a) * Math.cos(b) * r; pa[i * 3 + 1] = Math.sin(b) * r; pa[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r; }
    const gg = new T.BufferGeometry(); gg.setAttribute("position", new T.BufferAttribute(pa, 3)); const sm = new T.PointsMaterial({ size: 2.2, sizeAttenuation: false, color: 0xffffff, fog: false, transparent: true, opacity: .9 }); tr.push(gg, sm); bgFar.add(new T.Points(gg, sm)); }
  const planet = mk(tr, new T.SphereGeometry(26, 32, 20), basic(0xffffff, { map: planetTex, fog: false }), bgFar); planet.position.set(-95, 55, -230);
  const ring = mk(tr, new T.RingGeometry(36, 54, 64), basic(0xf7d9a0, { side: T.DoubleSide, transparent: true, opacity: .55, fog: false }), bgFar); ring.position.copy(planet.position); ring.rotation.set(1.25, .25, 0);
  const moon = mk(tr, new T.SphereGeometry(9, 20, 14), basic(0xe8e4ff, { fog: false }), bgFar); moon.position.set(110, 78, -210);
  [[moon.position, 0xbfc8ff, 60, .6], [new T.Vector3(0, 5, -255), 0xffa24a, 260, .75], [new T.Vector3(-150, 20, -180), 0xff4aa8, 190, .35], [new T.Vector3(150, 40, -150), 0x4a8aff, 170, .3]].forEach(([p, c, s, o]) => { const h = L.halo(c, s, o); h.position.copy(p); h.material.fog = false; bgFar.add(h); });
  [-1, 1].forEach((s, k) => { const m = new T.MeshBasicMaterial({ map: auroraTex, transparent: true, opacity: .8, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }), gg = new T.PlaneGeometry(260, 70, 32, 1); tr.push(m, gg);
    const a = new T.Mesh(gg, m); a.position.set(s * 40, 70, -180 - k * 20); a.rotation.x = -.15; a.userData.k = k; bgFar.add(a); W.aurora = (W.aurora || []).concat(a); });
  /* جزر بعيدة وشلالات */
  for (let i = 0; i < 11; i++) {
    const g = new T.Group(), r = 2 + R() * 3.6; g.position.set(-60 + R() * 120, -6 + R() * 26, -26 - R() * 55);
    mk(tr, new T.CylinderGeometry(r, r * .85, .8, 9), lam(0x6fd6a8), g).position.y = -.4; const rk = mk(tr, new T.ConeGeometry(r * .85, r * 1.8, 7), lam(0x5b3f6e, { flatShading: true }), g); rk.rotation.x = PI; rk.position.y = -.8 - r * .9;
    for (let k = 0; k < 3; k++) { const t = mk(tr, new T.ConeGeometry(.35, 1.1 + R(), 6), lam(0x35b886), g); t.position.set((R() - .5) * r, .6, (R() - .5) * r); }
    if (i % 3 === 0) { const w = mk(tr, new T.CylinderGeometry(.18, .5, 9, 8), basic(0x9ff7ff, { transparent: true, opacity: .45 }), g); w.position.set(r * .7, -4.6, 0); }
    g.userData = { y0: g.position.y, ph: R() * 6 }; bgMid.add(g); (W.mid = W.mid || []).push(g);
  }
  /* بلورات عائمة وشرارات قرب المسار */
  const cc = [0x55f0ff, 0xff5ad2, 0xffc84a, 0x8a6bff];
  for (let i = 0; i < 18; i++) {
    const m = lam(cc[i % 4], { emissive: cc[i % 4], emissiveIntensity: .5, flatShading: true }), c = mk(tr, new T.OctahedronGeometry(.4 + R() * .5, 0), m, bgNear); c.scale.y = 1.7;
    c.position.set(-30 + R() * 60, 1.5 + R() * 6, (R() < .5 ? -1 : 1) * (6.5 + R() * 6)); c.userData = { ph: R() * 6, sp: .4 + R() }; const h = L.halo(cc[i % 4], 2.6, .5); c.add(h); (W.crys = W.crys || []).push(c);
  }
  const FN = 90, fa = new Float32Array(FN * 3), fg = new T.BufferGeometry(); fg.setAttribute("position", new T.BufferAttribute(fa, 3).setUsage(T.DynamicDrawUsage));
  const fm = new T.PointsMaterial({ size: .38, color: 0xfff1a8, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false, map: L.glow }); tr.push(fg, fm); const fly = new T.Points(fg, fm); fly.frustumCulled = false; bgNear.add(fly);
  const fseed = Array.from({ length: FN }, () => [R(), R(), R(), R() * 6]);

  /* ===== المسارات ===== */
  const players = o.players, N = W.steps, HZ = { snake: makeSnake, rock: makeMeteor, slime: makeGoo }[W.kind] || makeSnake;
  const teamCol = i => new T.Color((players[i] && players[i].color) || (i ? "#8e5cf7" : "#ff6b6b"));
  for (let i = 0; i < 2; i++) {
    const lane = { i, z: LZ[i], step: 0, pos: { x: 0, y: 0 }, arc: 0, k0: 0, k1: 0, u: 0, jumping: false, gap: 9, gapT: 9, over: null, safety: 50, q: Promise.resolve(), yawT: -.5, isl: [], glow: 0 };
    const col = teamCol(i); lane.col = col;
    for (let k = 0; k <= N; k++) {
      const fin = k === N, isl = fin ? null : makeIsland(tr, col, k === 0, k === 0 ? 1.75 : IR);
      if (isl) { isl.g.position.set(xOf(k), 0, LZ[i]); sc.add(isl.g); lane.isl.push(isl); }
    }
    lane.isl[0].lit = 1;
    const hz = HZ(tr); sc.add(hz.g); lane.hz = hz;
    const a = S.makeActor(players[i], o.models && o.models[i]); sc.add(a.root); lane.actor = a; a.base.z = LZ[i]; a.base.yaw = -.5;
    const sh = mk(tr, new T.CircleGeometry(.85, 20), basic(0x000000, { transparent: true, opacity: .3, depthWrite: false }), sc); sh.rotation.x = -PI / 2; lane.sh = sh;
    /* راية البداية */
    const pole = mk(tr, new T.CylinderGeometry(.05, .05, 2.2, 6), lam(0xffffff), sc); pole.position.set(xOf(0) + 1.2, 1.1, LZ[i] - .6); const flag = mk(tr, new T.PlaneGeometry(.9, .55), basic(col, { side: T.DoubleSide }), sc); flag.position.set(xOf(0) + 1.62, 1.9, LZ[i] - .6); lane.flag = flag;
    W.lanes.push(lane);
  }
  /* ===== المنصة النهائية والبوابة والكأس ===== */
  const fx = xOf(N) - 2.4; W.fx = fx;
  const fin = makeIsland(tr, new T.Color(0xffd23f), true, 4.4); fin.g.position.set(fx, 0, 0); sc.add(fin.g); fin.rune.material.opacity = .55; W.finIsl = fin;
  const portal = new T.Group(); portal.position.set(fx - .6, 3.4, -3.7); sc.add(portal);
  const arch = mk(tr, new T.TorusGeometry(2.7, .26, 12, 48), phong(0xffd23f, { emissive: 0x7a5a00, shininess: 90 }), portal);
  const disc = mk(tr, new T.CircleGeometry(2.55, 40), basic(0xffffff, { map: swirlTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }), portal); W.disc = disc;
  const ph = L.halo(0x9a7aff, 11, .6); portal.add(ph);
  const cup = new T.Group(); cup.position.set(fx - .4, 0, 0); sc.add(cup);
  const lathe = new T.LatheGeometry([[.001, 0], [.55, 0], [.55, .12], [.18, .3], [.15, .8], [.45, .92], [.8, 1.55], [.88, 1.55], [.5, 1.0]].map(p => new T.Vector2(p[0], p[1])), 24); tr.push(lathe);
  const cm = phong(0xffd23f, { emissive: 0x805a00, shininess: 100, specular: 0xffffaa, side: T.DoubleSide }); tr.push(cm); const cupM = new T.Mesh(lathe, cm); cup.add(cupM); cup.position.y = .0; cup.scale.setScalar(1.1);
  const ch = L.halo(0xffe27a, 6, .5); ch.position.y = 1.4; cup.add(ch); W.cup = cup;

  /* ===== واجهة التحكم ===== */
  W.tween = (dur, fn) => new Promise(res => { W.tasks.push({ t0: W.time, dur: Math.max(.001, dur), fn, res }); });
  const burstAt = (lane, n, col) => { PS.emit(lane.actor.base.x, .2, lane.z, n, { col, sp: 3.4, up: 2, life: .9, size: .5, g: 5 }); };
  function jump(lane, k, opt) {
    opt = opt || {}; const a = lane.actor, x0 = lane.pos.x, x1 = k === N ? xOf(N) : xOf(k), h = opt.h || 2.3, dur = opt.dur || .8, dir = x1 < x0 ? -1 : 1;
    lane.jumping = true; lane.k0 = lane.step; lane.k1 = Math.min(k, N - 1); a.anim = null; lane.yawT = dir * PI / 2;
    return W.tween(.14, u => { a.ext.sy = 1 - .24 * Math.sin(u * PI / 2); a.ext.sx = 1 + .12 * Math.sin(u * PI / 2); })
      .then(() => { sfx("jump"); return W.tween(dur, u => { lane.pos.x = lerp(x0, x1, easeInOut(u)); lane.arc = 4 * h * u * (1 - u); lane.u = u; a.jumpU = u; const q = Math.sin(u * PI); a.ext.sy = 1 + .1 * q; a.ext.sx = 1 - .05 * q; }); })
      .then(() => { lane.pos.x = x1; lane.arc = 0; a.jumpU = -1; lane.step = k; lane.jumping = false; lane.yawT = -.5; sfx("land"); burstAt(lane, 14, [lane.col, 0xffffff, 0xffd23f]); if (lane.isl[k]) lane.isl[k].lit = 1; opt.onLand && opt.onLand();
        return W.tween(.16, u => { const q = Math.sin(u * PI); a.ext.sy = 1 - .2 * q; a.ext.sx = 1 + .1 * q; }); })
      .then(() => { a.ext.sx = a.ext.sy = 1; });
  }
  W.setPlayer = (i, p, url) => { const l = W.lanes[i]; l.actor.setPlayer(p, url); l.col.set(p.color || "#ff6b6b"); l.isl.forEach(s => { s.rim.material.color.copy(l.col); s.rune.material.color.copy(l.col); }); l.flag.material.color.copy(l.col); };
  W.setSafety = (i, v) => { const l = W.lanes[i]; l.safety = v; l.gapT = lerp(2.3, 10.5, c01(v / 100)); };
  W.setActive = (i, b) => { const l = W.lanes[i]; l.actor.flags.active = b; l.active = b; };
  W.react = (i, n) => { const l = W.lanes[i]; if (l.jumping || l.actor.flags.knocked) return; l.actor.play(n); if (n === "cheer") burstAt(l, 18, [0xff6b6b, 0xffd23f, 0x2ec4b6, 0x8e5cf7, 0x3a86ff]); };
  W.advance = i => { const l = W.lanes[i]; return new Promise(res => { if (l.step >= N) return res(); l.q = l.q.then(() => jump(l, l.step + 1, { onLand: res })); }); };
  W.strike = i => { const l = W.lanes[i], a = l.actor;
    l.q = l.q.then(() => { sfx("hiss"); l.over = l.gap; const g0 = l.gap; return W.tween(.5, u => { l.over = lerp(g0, .9, easeIn(u)); }); })
      .then(() => { sfx("hit"); W.kick = 1; PS.emit(a.base.x + .3, 1.2, l.z, 30, { col: [0xff8a1a, 0xffd24a, 0xffffff], sp: 5, life: .8, size: .7 }); a.flags.knocked = true;
        const kb = Math.max(0, l.step - 1), x0 = l.pos.x, x1 = xOf(kb); l.jumping = true; l.k0 = l.step; l.k1 = kb;
        return W.tween(1.1, u => { l.pos.x = lerp(x0, x1, easeOut(u)); l.arc = 4 * 3.2 * u * (1 - u); a.ext.rz = u * PI * 2; l.over = lerp(.9, 10, easeOut(u)); l.u = u; }).then(() => kb); })
      .then(kb => { l.step = kb; l.pos.x = xOf(kb); l.arc = 0; l.jumping = false; a.ext.rz = 0; a.flags.knocked = false; l.over = null; l.gap = 9; l.yawT = -.5; sfx("land"); a.play("sad"); });
    return l.q;
  };
  W.finale = win => {
    W.fin = { win, t0: W.time, next: 0 };
    W.lanes.forEach((l, i) => { const won = win === -1 || win === i;
      l.q = l.q.then(() => { l.actor.flags.active = false; if (!won) { l.actor.flags.lose = true; l.gapT = 2.6; return; }
        return jump(l, N, { h: 5, dur: 1.3 }).then(() => { l.actor.flags.win = true; sfx("win"); PS.emit(fx, 1, l.z, 50, { col: [0xff6b6b, 0xffd23f, 0x2ec4b6, 0x8e5cf7, 0x3a86ff], sp: 6, up: 5, life: 1.6, size: .8 }); }); }); });
  };
  W.skip = () => { W.calm = true; };
  W.destroy = () => { S.drop(W); W.lanes.forEach(l => l.actor.destroy()); free(tr); sc.clear(); };
  W.setPlayers = ps => ps.forEach((p, i) => W.setPlayer(i, p, o.models && o.models[i]));

  /* ===== الكاميرا والتحديث ===== */
  const camT = new T.Vector3(0, 1.1, 0), tgt = new T.Vector3(), bob = (i, k, t) => Math.sin(t * .8 + k * 1.7 + i * 2) * .1;
  W.fit = (asp, hh) => { W.asp = asp; W.hh = hh; W.cam.aspect = asp; W.cam.updateProjectionMatrix(); PS.mat.uniforms.uScale.value = hh / (2 * Math.tan(W.cam.fov * PI / 360)); };
  W.update = dt => {
    const t = (W.time += dt), red = L.reduced();
    for (let k = W.tasks.length - 1; k >= 0; k--) { const tk = W.tasks[k], u = c01((t - tk.t0) / tk.dur); tk.fn(u); if (u >= 1) { W.tasks.splice(k, 1); tk.res(); } }
    W.lanes.forEach((l, i) => {
      const a = l.actor; l.gap += (l.gapT - l.gap) * (1 - Math.exp(-dt * 2.5)); const g = l.over != null ? l.over : l.gap;
      a.flags.near = c01((6.4 - g) / 4);
      const b = l.jumping ? lerp(bob(i, l.k0, t), bob(i, l.k1, t), l.u) : bob(i, l.step, t);
      a.base.x = l.pos.x; a.base.y = b + l.arc; a.base.z = l.z; a.base.yaw += (l.yawT - a.base.yaw) * (1 - Math.exp(-dt * 9));
      a.update(dt);
      l.sh.position.set(a.base.x, b + .02, l.z); l.sh.scale.setScalar(Math.max(.4, 1 - l.arc * .12));
      l.isl.forEach((s, k) => { s.g.position.y = bob(i, k, t); const tgtO = s.lit ? (k === l.step ? .9 + Math.sin(t * 3) * .1 : .65) : .22; s.rune.material.opacity += (tgtO - s.rune.material.opacity) * .1; if (!red) s.rune.rotation.z = t * .15 * (k % 2 ? 1 : -1); });
      const near = a.flags.near, rise = c01((5.6 - g) / 3.2), hood = rise, mouth = c01((3.9 - g) / 1.6);
      l.hz.update(t, l.pos.x + g, l.z, .85 + (l.jumping ? 0 : bob(i, l.step, t)), rise, hood, mouth);
      l.flag.rotation.y = Math.sin(t * 2 + i) * .25;
    });
    /* الكاميرا */
    const xs = W.lanes.map(l => l.pos.x); let cx = (xs[0] + xs[1]) / 2; const act = W.lanes.find(l => l.active); if (act) cx = lerp(cx, act.pos.x, .3);
    let spread = Math.abs(xs[0] - xs[1]), hx = Math.max(7.4, spread / 2 + 6), dist;
    if (W.fin) { cx = fx + 1.5; hx = 9.5; }
    const tanV = Math.tan(W.cam.fov * PI / 360); dist = Math.min(36, Math.max(11.5, hx / (tanV * W.asp), 5.4 / tanV));
    camT.x += (cx - camT.x) * (1 - Math.exp(-dt * 2.2));
    W.kick = Math.max(0, W.kick - dt * 2.2); const ks = W.kick * .35, sw = red ? 0 : 1;
    W.cam.position.set(camT.x + Math.sin(t * .3) * .5 * sw + (Math.random() - .5) * ks, 3.2 + dist * .5 + Math.sin(t * .4) * .15 * sw + (Math.random() - .5) * ks, dist * .86);
    tgt.set(camT.x, .8, 0); W.cam.lookAt(tgt);
    /* خلفيات متوازية */
    bgFar.position.copy(W.cam.position); bgMid.position.x = camT.x * .8; bgNear.position.x = camT.x * .96;
    (W.mid || []).forEach(g => { g.position.y = g.userData.y0 + Math.sin(t * .3 + g.userData.ph) * .8; });
    (W.crys || []).forEach(c => { c.rotation.y = t * c.userData.sp; c.position.y += Math.sin(t * c.userData.sp + c.userData.ph) * .004; });
    (W.aurora || []).forEach(m => { const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, (i < 33 ? 35 : -35) + Math.sin(p.getX(i) * .05 + t * .5 + m.userData.k) * 5); p.needsUpdate = true; });
    const wob = fa; for (let i = 0; i < FN; i++) { const s = fseed[i]; wob[i * 3] = (s[0] - .5) * 40 + Math.sin(t * .5 + s[3]) * 1.5; wob[i * 3 + 1] = -1 + s[1] * 9 + Math.sin(t * .7 + s[3] * 2) * .6; wob[i * 3 + 2] = (s[2] - .5) * 18; } fg.attributes.position.needsUpdate = true;
    W.disc.rotation.z = -t * .8; portal.rotation.y = Math.sin(t * .5) * .1; cup.rotation.y = t * .9; cup.position.y = Math.sin(t * 2) * .08 + (W.fin ? .2 : 0);
    fin.rune.rotation.z = t * .1;
    /* ألعاب نارية عند النهاية */
    if (W.fin && !W.calm && !red && t > W.fin.next) { W.fin.next = t + .55 + Math.random() * .5; const col = [[0xff6b6b, 0xffd23f], [0x55f0ff, 0xffffff], [0xff5ad2, 0xffc84a], [0x8a6bff, 0x55f0ff]][(Math.random() * 4) | 0];
      PS.emit(fx - 4 + Math.random() * 8, 6 + Math.random() * 4, -2 + Math.random() * 4, 34, { col, sp: 5.5, life: 1.3, size: .9, g: 2.2 }); }
    PS.update(dt);
  };
  S.add(W);
  return W;
};
})();
