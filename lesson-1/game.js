(() => {
const C = window.GAME_CONFIG, G = C.game, M = C.messages, O = C.options, J = C.jokers;
const $ = s => document.querySelector(s);
const fmt = (t, n) => t.replace("{name}", n);
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const TYPES = { mcq: "اختر الإجابة", tf: "صح أم خطأ", fill: "أكمل", why: "علّل" };
const ansText = q => q.type === "mcq" ? q.opts[q.correct] : q.type === "tf" ? (q.correct ? "صح" : "خطأ") : q.a;
let cfg = C.players.map(p => ({ ...p })), S, W = null, muted = !G.sound, tick, uid = 0, PH = [];
/* ثلاثي الأبعاد: إن لم يتوفر WebGL تعمل اللعبة بدون المشهد (شاشة أسئلة ونقاط فقط) */
const S3 = window.Stage3D && window.Stage3D.ok && window.Stage3D.createWorld ? window.Stage3D : null;
const MODEL = p => p.model || (C.models && C.models[p.gender]) || "";
const NOW = { setSafety() {}, setActive() {}, react() {}, advance: () => Promise.resolve(), strike: () => Promise.resolve(), finale() {}, skip() {}, destroy() {} };
const killW = () => { if (W && W !== NOW) W.destroy(); W = NOW; }; W = NOW;

const r = document.documentElement.style, P = C.palette;
r.setProperty("--bg", P.bg); r.setProperty("--card", P.card); r.setProperty("--ink", P.ink);
r.setProperty("--accent", P.accent); r.setProperty("--ok", P.ok); r.setProperty("--no", P.no);
$("#title").textContent = C.title; $("#subtitle").textContent = C.subtitle; $("#desc").textContent = C.description; document.title = C.title;

/* ===== الصوت ===== */
let ac, nbuf;
function tone(f, d = .15, type = "sine", v = .12, to = 0, delay = 0) {
  if (muted) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + d); o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + d + .02);
  } catch (e) {}
}
function noise(d, v, hp) {
  if (muted) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (!nbuf) { nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const a = nbuf.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nbuf; f.type = "highpass"; f.frequency.value = hp;
    g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); s.connect(f); f.connect(g); g.connect(ac.destination); s.start(); s.stop(ac.currentTime + d);
  } catch (e) {}
}
const beep = (f, d, t, v) => tone(f, d, t, v);
const jingle = a => a.forEach((f, i) => tone(f, .18, "triangle", .12, 0, i * .13));
const sadSound = () => { tone(392, .35, "sine", .07, 330); tone(330, .55, "sine", .07, 247, .32); };
const sfx = n => ({ jump: () => tone(240, .22, "sine", .1, 560), land: () => tone(140, .12, "sine", .14, 70), hiss: () => noise(.55, .09, 3500),
  hit: () => { noise(.25, .14, 500); tone(120, .3, "sawtooth", .1, 50); }, win: () => jingle([523, 659, 784, 1046, 1318]) }[n] || (() => {}))();
$("#bSound").textContent = muted ? "🔇" : "🔊";
$("#bSound").onclick = () => { muted = !muted; $("#bSound").textContent = muted ? "🔇" : "🔊"; beep(660); };
if (!document.fullscreenEnabled) $("#bFull").hidden = true;
$("#bFull").onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();

/* الشخصية */
function face(p) {
  const id = "g" + (uid++), hair = "#4a2c1a", e = p.expression, k = p.gender;
  const back = k === "female" ? `<path d="M22 50q-6 44 8 58h40q14-14 8-58z" fill="${hair}"/>` : "";
  const top = k === "neutral" ? `<circle cx="50" cy="20" r="8" fill="${hair}"/><path d="M26 42q4-20 24-20t24 20q-24-9-48 0z" fill="${hair}"/>` : `<path d="M25 44q3-26 25-26t25 26q-25-11-50 0z" fill="${hair}"/>`;
  const mouth = { confident: "M39 61q11 9 22 0", genius: "M42 61q8 5 16 0", naughty: "M38 60q14 12 24-5", confused: "M38 62q6-5 12 0t12 0" }[e];
  const brow = { confident: "M33 38l12-2M55 36l12 2", genius: "M34 34h10M56 34h10", naughty: "M33 40l11-5M56 35l11 5", confused: "M33 36l11 3M56 39l11-3" }[e];
  const glasses = p.accessory === "glasses" || e === "genius" ? `<g fill="none" stroke="#222" stroke-width="2.5"><circle cx="40" cy="49" r="8"/><circle cx="60" cy="49" r="8"/><path d="M48 49h4"/></g>` : "";
  const acc = { crown: `<path d="M32 22l6-12 6 8 6-12 6 12 6-8 6 12z" fill="#ffd23f" stroke="#c98a00" stroke-width="2"/>`,
    cap: `<path d="M26 34q24-26 48 0z" fill="#3a86ff"/><path d="M60 33h26q-2 6-26 5z" fill="#2563c9"/>`,
    bow: `<path d="M50 78l-12-7v14zM50 78l12-7v14z" fill="#ff6b6b" stroke="#a8271d" stroke-width="1.5"/>` }[p.accessory] || "";
  return `<svg viewBox="0 0 100 124" aria-hidden="true"><defs>
<radialGradient id="${id}h" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="${p.skin}"/><stop offset="1" stop-color="${p.skin}" stop-opacity=".75"/></radialGradient>
<linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="${p.color}"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>
${back}<path class="arm l" d="M31 80q-12 6-10 24" stroke="${p.skin}" stroke-width="9" fill="none" stroke-linecap="round"/><path class="arm r" d="M69 80q12 6 10 24" stroke="${p.skin}" stroke-width="9" fill="none" stroke-linecap="round"/>
<rect x="27" y="74" width="46" height="42" rx="16" fill="url(#${id}b)"/>
<circle cx="50" cy="48" r="27" fill="url(#${id}h)"/>${top}
<circle cx="40" cy="49" r="${e === "confused" ? 4.5 : 3.2}" fill="#222"/><circle cx="60" cy="49" r="3.2" fill="#222"/>
<path d="${brow}" stroke="${hair}" stroke-width="3" stroke-linecap="round"/><path d="${mouth}" fill="none" stroke="#7a2e2e" stroke-width="3" stroke-linecap="round"/>${glasses}${acc}</svg>`;
}

/* ===== شاشة البداية ===== */
const sel = (o, v) => Object.entries(o).map(([k, t]) => `<option value="${k}"${k === v ? " selected" : ""}>${t}</option>`).join("");
function buildSetup() {
  $("#setup").innerHTML = cfg.map((p, i) => `<div class="card pv" data-i="${i}"><div class="pvs"></div>
<label>الاسم<input data-f="name" value="${esc(p.name)}" maxlength="22"></label>
<label>الشخصية<select data-f="gender">${sel(O.genders, p.gender)}</select></label>
<label>الإكسسوار<select data-f="accessory">${sel(O.accessories, p.accessory)}</select></label>
<label>الأسلوب<select data-f="expression">${sel(O.expressions, p.expression)}</select></label>
<label>لون البشرة</label><div class="sw" data-f="skin"></div><label>لون الملابس</label><div class="sw" data-f="color"></div></div>`).join("");
  document.querySelectorAll("#setup .card").forEach(card => {
    const i = +card.dataset.i, pvs = card.querySelector(".pvs");
    if (S3) { pvs.innerHTML = '<div class="s3 s3p"><canvas class="c3d"></canvas></div>'; PH[i] = S3.createPreview(pvs.querySelector(".c3d"), { player: cfg[i], model: MODEL(cfg[i]) }); }
    const draw = () => S3 ? PH[i].setPlayer(cfg[i], MODEL(cfg[i])) : pvs.innerHTML = face(cfg[i]);
    ["skin", "color"].forEach(f => {
      const box = card.querySelector(`.sw[data-f=${f}]`);
      box.innerHTML = O[f + "s"].map(c => `<button type="button" style="background:${c}" data-c="${c}" aria-label="${c}" aria-pressed="${c === cfg[i][f]}"></button>`).join("");
      box.onclick = e => { const b = e.target.closest("button"); if (!b) return; cfg[i][f] = b.dataset.c; box.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); draw(); };
    });
    card.addEventListener("input", e => { const f = e.target.dataset.f; if (f) { cfg[i][f] = e.target.value; draw(); } });
    draw();
  });
}
const nums = (a, v) => a.map(n => `<option value="${n}"${n === v ? " selected" : ""}>${n}</option>`).join("");
$("#oCount").innerHTML = nums(G.countChoices, G.questionCount); $("#oTime").innerHTML = nums(G.timeChoices, G.timeSeconds); $("#oScene").innerHTML = sel(O.scenes, G.scene);
buildSetup();
const show = id => { ["start", "play", "end"].forEach(s => $("#s-" + s).hidden = s !== id); $("#game").hidden = id === "start"; document.body.dataset.screen = id; window.scrollTo(0, 0); };
const stat = v => M.status.find(s => v >= s.min);
const clamp = v => Math.max(0, Math.min(100, v));

/* ===== العالم والواجهة ===== */
function buildHud() {
  $("#hud").innerHTML = S.pl.map((p, i) => `<div class="chip" data-i="${i}"><div class="cn">${esc(p.name)}</div><div class="cp"><span class="ci"></span> ⭐ <b class="pt">0</b></div><div class="meter" role="meter" aria-label="مستوى الأمان" aria-valuemin="0" aria-valuemax="100"><i></i></div></div>`).join("");
}
function buildWorld() {
  killW();
  $("#nowebgl").hidden = !!S3;
  if (S3) { W = S3.createWorld($("#w3d"), { players: S.pl, scene: S.scene, steps: Math.ceil(S.seq.length / 2), models: S.pl.map(MODEL) }); W.onsfx = sfx; S.pl.forEach((p, i) => W.setSafety(i, p.safety)); }
}
function upd() {
  document.querySelectorAll("#hud .chip").forEach((el, i) => {
    const p = S.pl[i], st = stat(p.safety), on = S.act === i && S.phase !== "done";
    el.classList.toggle("on", on); el.querySelector(".pt").textContent = p.points; el.querySelector(".ci").textContent = st.icon;
    el.querySelector(".meter i").style.width = p.safety + "%"; el.querySelector(".meter").setAttribute("aria-valuenow", p.safety);
    el.title = `${st.text} (${p.safety}%)` + (on ? (S.phase === "steal" ? " • فرصة السرقة" : " • دوره الآن") : "");
    W.setSafety(i, p.safety); W.setActive(i, on);
  });
}

/* ===== الجولات: الأسئلة بالتناوب بين الفريقين، سؤال واحد لكل دور ===== */
function buildSeq(n) {
  let qs = C.questions.slice(); if (G.shuffle) qs.sort(() => Math.random() - .5);
  const m = Math.min(n * 2, Math.floor(qs.length / 2) * 2);
  return qs.slice(0, m).map((q, i) => ({ q, t: i % 2 }));
}
function start() {
  const seq = buildSeq(+$("#oCount").value);
  if (!seq.length) return alert("أضف سؤالين على الأقل من المحرّر أولًا.");
  const jk = () => Object.fromEntries(Object.keys(J).map(k => [k, J[k].count]));
  S = { pl: cfg.map(p => ({ ...p, points: 0, safety: G.startSafety, jk: jk() })), seq, time: +$("#oTime").value, scene: $("#oScene").value, i: 0, act: 0, phase: "ask" };
  clearInterval(tick); show("play"); buildHud(); buildWorld(); question();
}
function question() {
  const { q, t } = S.seq[S.i];
  Object.assign(S, { q, act: t, phase: "ask", left: S.time, dbl: false, hid: [], bad: [], ju: {} });
  $("#qTurn").textContent = fmt(M.turn, S.pl[t].name); $("#qCat").textContent = TYPES[q.type] + " • " + q.cat; $("#qPts").textContent = q.points + " نقطة";
  $("#qText").textContent = q.q; $("#qAns").hidden = true; $("#qMsg").textContent = "";
  $("#bNext").hidden = true; setUI(); runTimer();
}
function setUI() { opts(); $("#judge").hidden = S.phase === "done" || S.q.type === "mcq" || S.q.type === "tf"; jokers(); upd(); }
function opts() {
  const q = S.q, done = S.phase === "done", L = ["أ", "ب", "ج", "د"]; let items = [];
  if (q.type === "mcq") items = q.opts.map((o, i) => [i, `${L[i]}) ${esc(o)}`]).filter(([i]) => !S.hid.includes(i));
  if (q.type === "tf") items = [[1, "✔ صح"], [0, "✖ خطأ"]];
  $("#qOpts").innerHTML = items.map(([i, t]) => {
    const right = q.type === "mcq" ? i === q.correct : i === (q.correct ? 1 : 0), bad = S.bad.includes(i);
    return `<button class="opt ${done && right ? "right" : ""} ${bad ? "bad" : ""}" data-v="${i}" ${done || bad ? "disabled" : ""}>${done && right ? "✅ " : bad ? "❌ " : ""}${t}</button>`;
  }).join("");
}
$("#qOpts").onclick = e => {
  const b = e.target.closest(".opt"); if (!b || S.phase === "done") return;
  const v = +b.dataset.v, q = S.q, ok = q.type === "mcq" ? v === q.correct : v === (q.correct ? 1 : 0);
  if (!ok) S.bad.push(v); judge(ok);
};
function jokers() {
  const box = $("#jk"), p = S.pl[S.act];
  if (S.phase !== "ask") { box.innerHTML = ""; return; }
  box.innerHTML = Object.keys(J).map(k => {
    const off = !p.jk[k] || S.ju[k] || (k === "hide2" && S.q.type !== "mcq");
    return `<button class="jkb" data-k="${k}" ${off ? "disabled" : ""}>${J[k].label} (${p.jk[k]})</button>`;
  }).join("");
}
$("#jk").onclick = e => {
  const b = e.target.closest(".jkb"); if (!b) return; const k = b.dataset.k, p = S.pl[S.act];
  p.jk[k]--; S.ju[k] = true; beep(900, .15, "triangle");
  if (k === "hide2") { const w = S.q.opts.map((_, i) => i).filter(i => i !== S.q.correct && !S.hid.includes(i)).sort(() => Math.random() - .5); S.hid.push(w[0], w[1]); }
  if (k === "time") { S.left += J.time.seconds; $("#qTime").textContent = S.left; }
  if (k === "double") { S.dbl = true; $("#qMsg").textContent = "نقاط مضاعفة لهذا السؤال!"; }
  setUI();
};
function runTimer() {
  clearInterval(tick); const el = $("#qTime");
  const paint = () => { el.textContent = S.left; el.classList.toggle("low", S.left <= 5); }; paint();
  tick = setInterval(() => {
    S.left--; paint(); if (S.left <= 5 && S.left > 0) beep(880, .06);
    if (S.left <= 0) { clearInterval(tick); beep(180, .4, "sawtooth"); $("#qMsg").textContent = M.timeUp; if (S.q.type === "mcq" || S.q.type === "tf") judge(false); }
  }, 1000);
}
const wrongReact = i => { sadSound(); W.react(i, Math.random() < .5 ? "sad" : "shy"); };
function judge(ok) {
  const q = S.q; clearInterval(tick);
  if (S.phase === "ask") {
    const me = S.pl[S.act], before = me.safety, a = S.act;
    if (ok) { me.points += q.points * (S.dbl ? 2 : 1); me.safety = clamp(me.safety + G.safetyStep); $("#qMsg").textContent = M.correct; jingle([523, 659, 784]); W.react(a, "cheer"); return finish(); }
    me.points = Math.max(0, me.points - Math.round(q.points * G.wrongPenalty)); me.safety = clamp(me.safety - G.safetyStep);
    wrongReact(a);
    if (me.safety <= 0 && before > 0) { upd(); W.strike(a).then(() => { me.safety = 35; upd(); }); }
    if (G.steal && q.type !== "tf") { S.phase = "steal"; S.act = 1 - a; S.left = S.time; $("#qMsg").textContent = fmt(M.stealAsk, S.pl[S.act].name); setUI(); return runTimer(); }
    $("#qMsg").textContent = M.wrong; return finish();
  }
  const me = S.pl[S.act];
  if (ok) { me.points += Math.round(q.points * G.stealPoints); me.safety = clamp(me.safety + G.stealSafety); $("#qMsg").textContent = M.stealWin; jingle([659, 784, 988]); W.react(S.act, "cheer"); }
  else { $("#qMsg").textContent = M.bothWrong; wrongReact(S.act); }
  finish();
}
function finish() {
  const q = S.q; S.phase = "done";
  $("#qAns").innerHTML = `✅ الإجابة النموذجية: ${esc(ansText(q))}` + (q.note ? `<br><small>${esc(q.note)}</small>` : ""); $("#qAns").hidden = false;
  $("#bNext").hidden = false; $("#bNext").disabled = false; $("#bNext").textContent = S.i + 1 >= S.seq.length ? "عرض النتيجة" : "التالي"; setUI(); $("#bNext").focus();
}
$("#bOk").onclick = () => judge(true); $("#bNo").onclick = () => judge(false);
/* بعد كل سؤال ينتقل صاحب الدور إلى الجزيرة التالية ثم يظهر السؤال الذي يليه */
$("#bNext").onclick = async () => {
  const b = $("#bNext"); if (b.disabled) return; b.disabled = true; const who = S.seq[S.i].t;
  await Promise.race([W.advance(who), new Promise(r => setTimeout(r, 4000))]);
  S.i++; if (S.i >= S.seq.length) return end(); question();
};

/* ===== النهاية ===== */
function end() {
  clearInterval(tick); const [a, b] = S.pl, tie = a.points === b.points, w = a.points > b.points ? 0 : 1;
  document.body.classList.remove("still"); show("end");
  $("#endTitle").textContent = tie ? M.tie : fmt(M.win, S.pl[w].name);
  $("#endScore").textContent = `${a.name}: ${a.points} — ${b.name}: ${b.points}`;
  $("#endLose").textContent = tie ? "" : fmt(M.lose, S.pl[1 - w].name);
  S.act = -1; upd(); W.finale(tie ? -1 : w); jingle([523, 659, 784, 1046]);
}
$("#bSkip").onclick = () => { document.body.classList.add("still"); W.skip(); };
$("#bAgain").onclick = start;
const reset = () => { clearInterval(tick); killW(); show("start"); };
$("#bNew").onclick = reset; $("#bReset").onclick = reset;
$("#bStart").onclick = () => { cfg.forEach((p, i) => p.name = p.name.trim() || C.players[i].name); start(); };
})();
