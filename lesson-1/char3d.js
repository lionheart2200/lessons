/* char3d — شخصيات مجسّمة لامعة (طراز الدمى الممتلئة) + حركات + دعم GLB + معاينة شاشة الإعداد */
(() => {
"use strict";
const S = window.Stage3D; if (!S || !S.ok) return;
const T = S.T, L = S.lib, PI = Math.PI, H = 2.9;
const { phong, lam, mk, free, easeOut, lerp, c01 } = L;

const EXP = {
  confident: { br: [-.15, .15], by: [.4, .4], es: [1, 1], m: "smile", ms: 1, mr: 0, mx: 0 },
  genius:    { br: [0, 0], by: [.46, .46], es: [1, 1], m: "smile", ms: .65, mr: 0, mx: 0 },
  naughty:   { br: [-.5, -.15], by: [.38, .47], es: [1, .72], m: "smile", ms: .8, mr: .38, mx: .06 },
  confused:  { br: [.3, -.1], by: [.4, .48], es: [1.3, .9], m: "flat", ms: .7, mr: -.15, mx: 0 }
};

/* ---------- المجسّم ---------- */
function buildChar(p, tr) {
  const root = new T.Group(), P = {}, skin = p.skin || "#ffcf9f", col = new T.Color(p.color || "#ff6b6b"), dark = col.clone().multiplyScalar(.6), hairC = 0x3b2416;
  const M = (g, c, par, o) => mk(tr, g, phong(c, o), par);
  P.leg = [-1, 1].map(s => {
    const hip = new T.Group(); hip.position.set(s * .23, .66, 0); root.add(hip);
    M(new T.CapsuleGeometry(.16, .2, 4, 10), dark, hip).position.y = -.22;
    const boot = M(new T.SphereGeometry(.24, 14, 10), 0xf4f4fa, hip, { shininess: 70 }); boot.scale.set(1, .68, 1.4); boot.position.set(0, -.5, .07);
    return hip;
  });
  P.body = M(new T.CapsuleGeometry(.46, .3, 8, 18), col, root, { shininess: 70, specular: 0x555555 }); P.body.position.y = 1.12; P.body.scale.z = .9;
  const belt = M(new T.TorusGeometry(.47, .05, 8, 22), dark, root); belt.rotation.x = PI / 2; belt.scale.y = .9; belt.position.y = .84;
  const emb = M(new T.SphereGeometry(.13, 12, 10), 0xffffff, root, { emissive: 0x666666 }); emb.scale.z = .25; emb.position.set(0, 1.26, .41);
  P.arm = [-1, 1].map(s => {
    const piv = new T.Group(); piv.position.set(s * .6, 1.5, 0); root.add(piv);
    M(new T.CapsuleGeometry(.14, .28, 4, 10), col, piv, { shininess: 70 }).position.y = -.26;
    M(new T.SphereGeometry(.18, 12, 10), skin, piv, { shininess: 60 }).position.y = -.58;
    return piv;
  });
  const head = new T.Group(); head.position.y = 2.2; root.add(head); P.head = head;
  M(new T.SphereGeometry(.7, 30, 22), skin, head, { shininess: 60, specular: 0x555555 });
  [-1, 1].forEach(s => M(new T.SphereGeometry(.14, 10, 8), skin, head).position.set(s * .68, -.02, 0));
  M(new T.SphereGeometry(.08, 10, 8), skin, head).position.set(0, -.06, .68);
  P.blush = [-1, 1].map(s => { const m = M(new T.SphereGeometry(.1, 10, 8), 0xff6f7f, head, { transparent: true, opacity: .35 }); m.scale.set(1, .65, .3); m.position.set(s * .42, -.14, .52); m.rotation.y = s * .7; return m; });
  P.eye = [-1, 1].map(s => {
    const g = new T.Group(); g.position.set(s * .26, .1, .6); head.add(g);
    const w = M(new T.SphereGeometry(.14, 14, 10), 0xffffff, g, { shininess: 90 }); w.scale.set(1, 1.2, .5);
    const ir = new T.Group(); g.add(ir);
    const iris = M(new T.SphereGeometry(.09, 12, 10), 0x1b1b2e, ir); iris.position.z = .04; iris.scale.set(1, 1.1, .6);
    M(new T.SphereGeometry(.03, 8, 6), 0xffffff, ir, { emissive: 0xffffff }).position.set(.035, .045, .085);
    g.userData.ir = ir; return g;
  });
  P.brow = [-1, 1].map(s => { const b = M(new T.BoxGeometry(.24, .055, .05), hairC, head); b.position.set(s * .26, .4, .56); return b; });
  const mg = new T.Group(); mg.position.set(0, -.22, .6); mg.rotation.x = .35; head.add(mg);
  P.mouth = M(new T.TorusGeometry(.2, .035, 6, 16, PI), 0x7a2e2e, mg);
  P.mouthO = M(new T.TorusGeometry(.07, .035, 6, 12), 0x7a2e2e, mg); P.mouthO.position.y = -.05; P.mouthO.visible = false;
  /* الشعر */
  const hair = M(new T.SphereGeometry(.735, 26, 16, 0, PI * 2, 0, PI * .56), hairC, head, { shininess: 50 }); hair.rotation.x = -.28; hair.position.y = .04;
  if (p.gender === "female") {
    const b = M(new T.SphereGeometry(.72, 18, 14), hairC, head); b.scale.set(1.05, 1.3, .7); b.position.set(0, -.4, -.3);
    [-1, 1].forEach(s => M(new T.SphereGeometry(.2, 12, 10), hairC, head).position.set(s * .66, .02, -.05));
  } else if (p.gender === "neutral") M(new T.SphereGeometry(.24, 12, 10), hairC, head).position.set(0, .8, -.14);
  else for (let i = -1; i <= 1; i++) { const sp = M(new T.ConeGeometry(.1, .3, 8), hairC, head); sp.position.set(i * .25, .72, .08); sp.rotation.z = -i * .35; }
  /* الإكسسوارات */
  const a = p.accessory;
  if (a === "glasses" || p.expression === "genius") {
    [-1, 1].forEach(s => M(new T.TorusGeometry(.18, .025, 8, 20), 0x222222, head).position.set(s * .26, .1, .66));
    M(new T.BoxGeometry(.12, .03, .03), 0x222222, head).position.set(0, .12, .68);
  }
  if (a === "crown") {
    const cg = new T.Group(); cg.position.y = .78; head.add(cg); const gold = lam(0xffd23f, { emissive: 0x664400 });
    mk(tr, new T.CylinderGeometry(.38, .42, .15, 12), gold, cg);
    for (let i = 0; i < 5; i++) { const c = mk(tr, new T.ConeGeometry(.09, .26, 8), gold, cg); const an = i / 5 * PI * 2; c.position.set(Math.cos(an) * .34, .2, Math.sin(an) * .34); }
  }
  if (a === "cap") {
    const c = M(new T.SphereGeometry(.79, 22, 12, 0, PI * 2, 0, PI * .5), 0x3a86ff, head); c.position.y = .1; c.rotation.x = -.18;
    const v = M(new T.BoxGeometry(.62, .05, .46), 0x2563c9, head); v.position.set(0, .22, .82); v.rotation.x = .18;
  }
  if (a === "bow") {
    const bg = new T.Group(); bg.position.set(0, 1.66, .42); root.add(bg);
    [-1, 1].forEach(s => { const c = M(new T.ConeGeometry(.14, .32, 8), 0xff6b6b, bg); c.rotation.z = -s * PI / 2; c.position.x = s * .17; });
    M(new T.SphereGeometry(.09, 10, 8), 0xff6b6b, bg);
  }
  return { root, P };
}
function buildDecor(tr, p) {
  const g = new T.Group(), D = { group: g }, LL = (geo, mat, par) => mk(tr, geo, mat, par);
  D.arrow = LL(new T.ConeGeometry(.22, .46, 12), lam(0xffd23f, { emissive: 0x664400 }), g); D.arrow.rotation.x = PI; D.arrow.position.y = 3.75; D.arrow.visible = false;
  D.sweat = new T.Group(); D.sweat.position.set(.62, 2.7, .35); D.sweat.visible = false; g.add(D.sweat);
  const bm = lam(0x7fd0ff, { emissive: 0x2a6a9a }); LL(new T.SphereGeometry(.09, 10, 8), bm, D.sweat); LL(new T.ConeGeometry(.07, .16, 8), bm, D.sweat).position.y = .11;
  D.tears = [-1, 1].map(s => { const d = LL(new T.SphereGeometry(.06, 8, 6), bm, g); d.userData.x = s * .26; d.visible = false; return d; });
  D.cloud = new T.Group(); D.cloud.position.y = 3.7; D.cloud.visible = false; g.add(D.cloud);
  const cm = lam(0x8f98b8); [[-.34, 0, .3], [0, .1, .4], [.34, 0, .3]].forEach(([x, y, r]) => LL(new T.SphereGeometry(r, 12, 10), cm, D.cloud).position.set(x, y, 0));
  D.drops = [0, 1, 2, 3].map(i => { const d = LL(new T.SphereGeometry(.05, 8, 6), bm, D.cloud); d.userData.x = (i - 1.5) * .24; return d; });
  D.sp = new T.Group(); D.sp.position.y = 1.6; D.sp.visible = false; g.add(D.sp);
  for (let i = 0; i < 6; i++) { const s = LL(new T.OctahedronGeometry(.12), lam(0xffd23f, { emissive: 0x886600 }), D.sp); const an = i / 6 * PI * 2; s.position.set(Math.cos(an) * 1.4, Math.sin(i * 1.7) * .6, Math.sin(an) * 1.4); }
  return D;
}

/* ---------- نماذج GLB (تُحمَّل مرة واحدة وتُشارَك) ---------- */
const MAXTEX = 512, glbCache = {};
function shrink(tex) {
  const im = tex && tex.image; if (!im) return;
  const w = im.width || im.naturalWidth, hh = im.height || im.naturalHeight; if (!w || Math.max(w, hh) <= MAXTEX) return;
  const k = MAXTEX / Math.max(w, hh), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(hh * k));
  const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(im, 0, 0, c.width, c.height); im.close && im.close(); tex.image = c; tex.needsUpdate = true;
}
function prepGLB(g) {
  const sc = g.scene, done = new Map(); sc.updateMatrixWorld(true);
  sc.traverse(n => {
    if (!n.isMesh) return; n.frustumCulled = false;
    const conv = m => {
      if (done.has(m)) return done.get(m);
      [m.map, m.emissiveMap].forEach(t => { if (t) { shrink(t); t.encoding = T.LinearEncoding; t.needsUpdate = true; } });
      const l = new T.MeshLambertMaterial({ color: m.color ? m.color.clone() : 0xffffff, map: m.map || null, transparent: m.transparent, opacity: m.opacity, alphaTest: m.alphaTest, side: m.side, emissive: m.emissive ? m.emissive.clone() : 0x000000, emissiveMap: m.emissiveMap || null });
      done.set(m, l); return l;
    };
    n.material = Array.isArray(n.material) ? n.material.map(conv) : conv(n.material);
  });
  const box = new T.Box3(), v = new T.Vector3(); let sk = 0;
  sc.traverse(n => {
    if (n.isSkinnedMesh && n.boneTransform) { n.skeleton.update(); const pos = n.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); n.boneTransform(i, v); v.applyMatrix4(n.matrixWorld); box.expandByPoint(v); } sk++; }
    else if (n.isMesh) box.union(new T.Box3().setFromObject(n));
  });
  if (!sk && box.isEmpty()) box.setFromObject(sc);
  const size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
  g.userData = { k: H / (size.y || 1), cx: c.x, cz: c.z, y0: box.min.y };
}
const getGLB = url => glbCache[url] || (glbCache[url] = new Promise((ok, no) => new T.GLTFLoader().load(url, g => { try { prepGLB(g); ok(g); } catch (e) { no(e); } }, undefined, no)));
const _a = new T.Vector3(), _b = new T.Vector3(), _f = new T.Vector3(), _c = new T.Quaternion(), _d = new T.Quaternion(), _e = new T.Quaternion();
function findArms(obj) {
  const by = {}; obj.traverse(n => { if (n.isBone) by[n.name.replace(/^mixamorig[:_]?/i, "").toLowerCase()] = n; }); obj.updateMatrixWorld(true);
  const mkA = (a, f) => { const b = by[a], c = by[f]; if (!b || !c) return null; b.getWorldPosition(_a); c.getWorldPosition(_b); return { b, c, q0: b.quaternion.clone(), out: Math.sign(_b.x - _a.x) || 1 }; };
  const A = [mkA("leftarm", "leftforearm"), mkA("rightarm", "rightforearm")]; return A[0] && A[1] ? A : null;
}
function aimArm(a, lift, rq) {
  const b = a.b; b.quaternion.copy(a.q0); b.updateMatrixWorld(true);
  b.getWorldPosition(_a); a.c.getWorldPosition(_b); _b.sub(_a).normalize();
  _f.set(a.out * Math.sin(lift), -Math.cos(lift), 0).applyQuaternion(rq);
  _c.setFromUnitVectors(_b, _f); b.getWorldQuaternion(_d); _d.premultiply(_c); b.parent.getWorldQuaternion(_e); b.quaternion.copy(_e.invert().multiply(_d));
}

/* ---------- الممثل (Actor): مجسّم + حركات ---------- */
const DUR = { cheer: 1700, sad: 2000, shy: 2000, knock: 1200 };
function face(P, ex, mood, blink, look, open, shy) {
  let br = ex.br, by = ex.by, es = ex.es, m = ex.m, ms = ex.ms, mr = ex.mr, mx = ex.mx, O = false;
  if (mood === "happy") { m = "smile"; ms = 1.4; mr = 0; mx = 0; by = [by[0] + .05, by[1] + .05]; es = [1.05, 1.05]; }
  else if (mood === "sad") { m = "frown"; ms = .9; mr = 0; mx = 0; br = [.45, -.45]; by = [.38, .38]; es = [.9, .9]; }
  else if (mood === "shy") { m = "flat"; ms = .55; mr = .22; mx = 0; br = [.4, -.4]; by = [.42, .42]; es = [.95, .95]; }
  else if (mood === "worry") { m = "frown"; ms = .55; mr = 0; mx = 0; br = [.3, -.3]; es = [1.1, 1.1]; }
  else if (mood === "shock") { O = true; br = [0, 0]; by = [.5, .5]; es = [1.4, 1.4]; }
  P.brow.forEach((b, i) => { b.rotation.z = br[i]; b.position.y = by[i]; });
  P.eye.forEach((e, i) => { e.scale.set(es[i], es[i] * blink * open, es[i]); e.userData.ir.position.x = look * .06; });
  P.blush.forEach(b => { b.material.opacity = .3 + .65 * shy; });
  P.mouth.visible = !O; P.mouthO.visible = O; if (O) return;
  if (m === "frown") { P.mouth.rotation.z = 0; P.mouth.position.set(0, -.1 * ms, 0); P.mouth.scale.set(ms, ms, 1); }
  else if (m === "flat") { P.mouth.rotation.z = PI + mr; P.mouth.position.set(0, .02, 0); P.mouth.scale.set(ms, .2, 1); }
  else { P.mouth.rotation.z = PI + mr; P.mouth.position.set(mx, .1 * ms, 0); P.mouth.scale.set(ms, ms, 1); }
}

S.makeActor = function (p, url) {
  const a = { root: new T.Group(), ctr: [], dtr: [], seed: Math.random() * 6, time: Math.random() * 10, anim: null, flags: { active: false, near: 0, win: false, lose: false, knocked: false },
    jumpU: -1, base: { x: 0, y: 0, z: 0, yaw: 0 }, off: { y: 0, yaw: 0, lean: 0 }, ext: { sx: 1, sy: 1, rz: 0 }, sig: "", tok: 0, char: null };
  a.root.rotation.order = "ZYX";
  a.setPlayer = (pl, u) => {
    const sig = [pl.gender, pl.accessory, pl.expression, pl.skin, pl.color, u].join("|"); if (sig === a.sig) return; a.sig = sig; a.p = pl;
    if (a.char) { a.root.remove(a.char.root); free(a.ctr); free(a.dtr); a.char.dispose && a.char.dispose(); }
    const c = buildChar(pl, a.ctr); c.D = buildDecor(a.dtr, pl); c.root.add(c.D.group); c.exp = EXP[pl.expression] || EXP.confident; a.root.add(c.root); a.char = c;
    const tok = ++a.tok; if (u && T.GLTFLoader) loadGLB(a, u, tok);
  };
  a.play = (n, ms) => { a.anim = { name: n, t0: a.time, d: (ms || DUR[n] || 1600) / 1000 }; };
  a.update = dt => { a.time += dt; pose(a); };
  a.destroy = () => { if (a.char) a.char.dispose && a.char.dispose(); free(a.ctr); free(a.dtr); };
  a.setPlayer(p, url); return a;
};
function loadGLB(a, url, tok) {
  getGLB(url).then(g => {
    if (tok !== a.tok) return;
    const obj = T.SkeletonUtils ? T.SkeletonUtils.clone(g.scene) : g.scene.clone(true), u = g.userData;
    obj.scale.multiplyScalar(u.k); obj.position.set(-u.cx * u.k, -u.y0 * u.k, -u.cz * u.k);
    const root = new T.Group(); root.add(obj); const old = a.char, D = old.D; root.add(D.group); a.root.remove(old.root); free(a.ctr);
    const c = { root, P: null, D, glb: true, exp: old.exp, mixer: null, acts: {}, cur: "" };
    const clips = (g.animations || []).filter(x => x.duration >= .5);
    if (clips.length) {
      c.mixer = new T.AnimationMixer(obj); const act = clips.find(x => /idle|stand|breath/i.test(x.name)) || clips[0]; c.acts.idle = c.mixer.clipAction(act); c.acts.idle.play();
    } else c.arms = findArms(obj);
    c.dispose = () => { c.mixer && c.mixer.uncacheRoot(obj); };
    a.root.add(root); a.char = c;
  }).catch(err => console.warn("تعذّر تحميل نموذج GLB، سيُستخدم المجسّم الافتراضي:", url, err));
}

function pose(a) {
  const t = a.time, c = a.char, P = c.P, D = c.D, F = a.flags, red = L.reduced(), R = a.root;
  let an = a.anim, u = 0, nm = "";
  if (an) { u = (t - an.t0) / an.d; nm = an.name; if (u >= 1) { a.anim = null; nm = ""; u = 0; } }
  const e = Math.min(1, u * 6, (1 - u) * 6);    /* غلاف تدرّج الدخول والخروج */
  let lL = .2, lR = .2, fL = 0, fR = 0, hx = 0, hy = 0, hz = 0, bsy = 1, tuck = 0, mood = "idle", look = 0, open = 1, shy = 0, sweat = false, tears = false, cl = false, sp = false, yO = 0, yawO = 0, lean = 0;
  if (!red) { const sw = Math.sin(t * 2 + a.seed); yO += Math.sin(t * 2.2 + a.seed) * .035; lL += sw * .04; lR -= sw * .04; hy += Math.sin(t * .9 + a.seed) * .1; }
  if (F.near > .6 && !nm) { mood = "worry"; sweat = F.near > .85; }
  if (F.active && !red && !nm) yO += Math.abs(Math.sin(t * 3)) * .05;
  if (a.jumpU >= 0) { const k = Math.sin(PI * a.jumpU); lL = lR = .3 + 2.0 * k; tuck = .9 * k; mood = "happy"; }
  else if (F.win) { mood = "happy"; lL = lR = 2.6 + (red ? 0 : Math.sin(t * 8) * .25); sp = !red; if (!red) yO += Math.abs(Math.sin(t * 4)) * .4; }
  else if (F.lose) { mood = "sad"; hx = .5; lL = lR = .05; fL = fR = .12; bsy = .95; yO -= .06; tears = true; look = -.4; open = .75; }
  else if (nm === "cheer") { yO += Math.abs(Math.sin(u * PI * 4)) * (1 - u * .5) * .4; yawO = easeOut(Math.min(1, u * 1.3)) * PI * 2; lL = lR = 2.6 + Math.sin(t * 16) * .25; hy = Math.sin(t * 10) * .12; mood = "happy"; sp = true; }
  else if (nm === "sad") { hx = .5 * e; lL = lR = lerp(.2, .05, e); fL = fR = .15 * e; bsy = 1 - .05 * e; yO -= .06 * e; mood = "sad"; tears = true; cl = true; open = lerp(1, .75, e); }
  else if (nm === "shy") { hy = .5 * e; hz = .22 * e; lR = lerp(.2, 2.35 + Math.sin(t * 9) * .1, e); fR = .5 * e; mood = "shy"; shy = e; sweat = true; look = -.6 * e; lean = .06 * e; }
  else if (nm === "knock" || F.knocked) { lL = lR = 2.2; mood = "shock"; }
  /* تطبيق */
  const blink = (t + a.seed) % 3.6 < .12 ? .12 : 1;
  if (P) {
    P.arm[0].rotation.set(-fL, 0, -lL); P.arm[1].rotation.set(-fR, 0, lR); P.leg.forEach(h => { h.rotation.x = -tuck; });
    P.head.rotation.set(hx, hy, hz); P.body.scale.y = bsy; face(P, c.exp, mood, mood === "shock" ? 1 : blink, look, open, shy);
  }
  const ex = a.ext;
  R.position.set(a.base.x, a.base.y + yO, a.base.z); R.rotation.set(lean, a.base.yaw + yawO, ex.rz); R.scale.set(ex.sx, ex.sy, ex.sx);
  if (c.arms) { R.updateMatrixWorld(true); c.arms.forEach(m => aimArm(m, m.out < 0 ? lL : lR, R.quaternion)); }
  if (c.mixer) c.mixer.update(.033);
  D.arrow.visible = F.active && !nm && a.jumpU < 0; D.arrow.position.y = 3.75 + Math.sin(t * 5) * .1;
  D.sweat.visible = sweat; D.sweat.position.y = 2.7 + Math.sin(t * 4) * .03;
  D.tears.forEach((d, i) => { d.visible = tears; if (tears) { const ph = (t * 1.1 + i * .5) % 1; d.position.set(d.userData.x, 2.3 - ph * .6, .62); } });
  D.cloud.visible = cl; if (cl) D.drops.forEach((d, i) => { const ph = (t * 1.4 + i * .27) % 1; d.position.set(d.userData.x, -.3 - ph * 1.1, .1); d.visible = ph < .9; });
  D.sp.visible = sp; D.sp.rotation.y = t * 1.6;
}

/* ---------- معاينة شاشة الإعداد ---------- */
S.createPreview = function (canvas, o) {
  const h = { canvas, ctx: canvas.getContext("2d"), scene: new T.Scene(), cam: new T.PerspectiveCamera(30, 2, .1, 60), dead: false, tr: [] };
  h.scene.add(new T.AmbientLight(0xffffff, .75)); const sun = new T.DirectionalLight(0xffffff, .9); sun.position.set(3, 6, 6); h.scene.add(sun);
  mk(h.tr, new T.CylinderGeometry(1.15, 1.25, .14, 32), phong(0xe9e4ff), h.scene).position.y = -.07;
  const ring = mk(h.tr, new T.TorusGeometry(1.1, .04, 6, 40), L.basic(new T.Color(o.player.color || "#ff6b6b")), h.scene); ring.rotation.x = PI / 2; ring.position.y = .01;
  const a = S.makeActor(o.player, o.model); h.scene.add(a.root); a.base.y = .06; h.actor = a;
  h.fit = asp => { h.cam.aspect = asp; h.cam.position.set(0, 1.9, 8.2 * Math.max(1, .95 / asp)); h.cam.lookAt(0, 1.5, 0); h.cam.updateProjectionMatrix(); };
  h.update = dt => { a.base.yaw = L.reduced() ? 0 : Math.sin(a.time * .8) * .6; a.update(dt); };
  h.setPlayer = (p, u) => { a.setPlayer(p, u); ring.material.color.set(p.color || "#ff6b6b"); };
  h.destroy = () => { S.drop(h); a.destroy(); free(h.tr); h.scene.clear(); };
  S.add(h); return h;
};
})();
