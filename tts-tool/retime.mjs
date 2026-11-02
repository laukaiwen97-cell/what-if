// Re-times every scene to the narration: maps each scene's old animation times onto
// the voice with piecewise-linear anchors, re-slots the scenes, voice and sound effects.
// usage: node retime.mjs <projectDir>
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
const comp = (n) => path.join(dir, "compositions", n);

// old local time -> new local time, per scene
const MAPS = {
  s1: [[0, 0], [0.8, 3.15], [1.05, 3.4], [2.45, 5.6], [4.32, 6.72], [4.6, 7.0]],
  s2: [[0, 0], [0.55, 0.8], [1.1, 1.68], [2.2, 2.3], [4.35, 3.55], [4.95, 4.0], [5.4, 4.4]],
  s3: [[0, 0], [1.3, 1.2], [3.1, 3.9], [5.25, 5.95], [7.4, 8.05], [8.35, 10.2], [9.5, 11.3], [9.6, 11.4]],
  s4: [[0, 0], [2.4, 2.6], [3.0, 3.25], [3.8, 4.7], [4.3, 5.25], [5.8, 6.75], [6.0, 6.95]],
  s5: [[0, 0], [1.0, 0.9], [2.6, 1.4], [3.3, 3.0], [6.2, 5.4], [6.8, 7.3], [7.95, 8.6], [8.25, 10.2], [10.55, 13.7], [10.8, 14.0]],
  s6: [[0, 0], [0.2, 0.1], [0.45, 2.5], [3.3, 3.8], [4.0, 5.75], [4.7, 6.5], [5.3, 7.0], [6.85, 7.9], [8.0, 9.3], [8.25, 9.45], [10.85, 12.5], [11.5, 13.15]],
  s7: [[0, 0], [0.75, 0.3], [1.75, 0.9], [2.55, 1.6], [3.78, 3.06], [4.64, 3.91], [5.45, 4.78], [6.14, 5.42], [7.12, 6.3], [8.55, 8.1], [8.8, 8.35]],
  s8: [[0, 0], [0.45, 0.45], [1.6, 1.9], [2.6, 4.7], [4.0, 6.7], [4.3, 6.95], [4.45, 7.1], [5.6, 8.45], [7.6, 11.5]],
};
const FILES = { s1: "s1-hook.html", s2: "s2-chat.html", s3: "s3-day1.html", s4: "s4-tehtarik.html", s5: "s5-year1.html", s6: "s6-third.html", s7: "s7-table.html", s8: "s8-ask.html" };
const OLD_START = { s1: 0, s2: 4.6, s3: 10, s4: 19.6, s5: 25.6, s6: 36.4, s7: 47.9, s8: 56.7 };
const order = Object.keys(MAPS);
const NEW_START = {};
let acc = 0;
for (const s of order) { NEW_START[s] = +acc.toFixed(3); acc += MAPS[s].at(-1)[1]; }
const TOTAL = +acc.toFixed(3);

const mapT = (m, t) => {
  for (let i = 1; i < m.length; i++) {
    const [a0, b0] = m[i - 1], [a1, b1] = m[i];
    if (t <= a1) return b0 + ((t - a0) * (b1 - b0)) / (a1 - a0);
  }
  const [a, b] = m.at(-1);
  return b + (t - a);
};

// 1) scene files: a timeline shim that remaps every numeric position through the scene's map
const SHIM = (m) => `const tl = gsap.timeline({ paused: true });
      // re-timed to the narration: old scene times map onto the voice
      const MAPK = ${JSON.stringify(m)};
      const T = (t) => { for (let i = 1; i < MAPK.length; i++) { const [a0, b0] = MAPK[i - 1], [a1, b1] = MAPK[i]; if (t <= a1) return b0 + ((t - a0) * (b1 - b0)) / (a1 - a0); } const [a, b] = MAPK[MAPK.length - 1]; return b + (t - a); };
      ["to", "fromTo", "set"].forEach((m) => { const f = tl[m].bind(tl); tl[m] = (...a) => { const i = a.length - 1; if (typeof a[i] === "number") a[i] = T(a[i]); return f(...a); }; });`;
for (const s of order) {
  const f = comp(FILES[s]);
  let src = fs.readFileSync(f, "utf8");
  if (src.includes("const MAPK")) throw new Error(s + " already re-timed");
  const head = "const tl = gsap.timeline({ paused: true });";
  if (!src.includes(head)) throw new Error("no timeline in " + s);
  src = src.replace(head, SHIM(MAPS[s]));
  const sub = (a, b) => { if (!src.includes(a)) throw new Error(s + " missing: " + a.slice(0, 60)); src = src.replace(a, b); };
  if (s === "s1") {
    sub(`{ rotation: 700, svgOrigin: "0 0", duration: 1.6`, `{ rotation: 1600, svgOrigin: "0 0", duration: 3.7`);
    sub(`{ rotation: 760, svgOrigin: "0 0", duration: 1.6`, `{ rotation: 1660, svgOrigin: "0 0", duration: 3.7`);
    sub(`at: 1.05 + ((x - 140) / 680) * 0.7 + rnd() * 0.08`, `at: T(1.05 + ((x - 140) / 680) * 0.7 + rnd() * 0.08)`);
    sub(`{ p: 1, duration: 4.6, ease: "none"`, `{ p: 1, duration: 7.0, ease: "none"`);
    sub(`{ clipPath: "inset(0% 0% 0% 100%)", duration: 0.75,`, `{ clipPath: "inset(0% 0% 0% 100%)", duration: 1.2,`);
  }
  if (s === "s4") {
    sub(`at: 2.75 + ((x - 300) / 500) * 0.9 + rnd() * 0.12`, `at: T(2.75 + ((x - 300) / 500) * 0.9 + rnd() * 0.12)`);
    sub(`{ p: 1, duration: 6, ease: "none"`, `{ p: 1, duration: 6.95, ease: "none"`);
    sub(`{ clipPath: "inset(0px 0px 0px 840px)", duration: 1.05,`, `{ clipPath: "inset(0px 0px 0px 840px)", duration: 1.7,`);
  }
  fs.writeFileSync(f, src);
}

// 2) index: scene slots, length, voice, sound effects
const idx = path.join(dir, "index.html");
let h = fs.readFileSync(idx, "utf8");
for (const s of order) {
  const re = new RegExp(`(id="${s}"[^>]*?)data-start="[\\d.]+" data-duration="[\\d.]+"`);
  if (!re.test(h)) throw new Error("no host " + s);
  h = h.replace(re, `$1data-start="${NEW_START[s]}" data-duration="${MAPS[s].at(-1)[1]}"`);
}
h = h.replace(/(id="root"[^>]*?)data-duration="[\d.]+"/, `$1data-duration="${TOTAL}"`);
h = h.replace(/i < \d+ \* 12/, `i < ${Math.ceil(TOTAL) + 1} * 12`);

// voice: one continuous narration, 0.15 s breath between scenes
const timing = JSON.parse(fs.readFileSync(path.join(dir, "assets/vo-narr/timing.json"), "utf8"));
h = h.replace(/\n[^\n]*<audio id="vo-\d"[^\n]*<\/audio>/g, "");
let t = 0.25;
const vo = [];
Object.keys(timing).forEach((k, i) => {
  vo.push(`      <audio id="vo-${i + 1}" class="clip" src="assets/vo-narr/${k}.mp3" data-start="${t.toFixed(3)}" data-duration="${timing[k].total}" data-track-index="3" data-volume="1"></audio>`);
  t += timing[k].total + 0.15;
});
h = h.replace(/<!-- VOICE:[^\n]*-->/, "<!-- VOICE: ms-MY Yasmin neural, narrated phrase by phrase -->\n" + vo.join("\n"));

// sound effects follow their pictures through the same maps
const PEAK = { sfx_001: 0.162, sfx_002: 0.12, sfx_003: 0.229, sfx_004: 0.745, sfx_006: 0.073 };
const scenes = order.map((s) => [s, OLD_START[s]]);
h = h.replace(/(<audio id="sfx-[^"]*"[^>]*src="assets\/sfx\/(sfx_\d+)\.mp3"[^>]*?data-start=")([\d.]+)("[^>]*>)/g, (m, a, file, st, b) => {
  const rate = parseFloat((m.match(/data-playback-rate="([\d.]+)"/) || [0, 1])[1]);
  const pic = parseFloat(st) + PEAK[file] / rate - 1 / 30;
  let sc = scenes[0];
  for (const x of scenes) if (pic >= x[1] - 0.05) sc = x;
  const nt = NEW_START[sc[0]] + mapT(MAPS[sc[0]], Math.max(0, pic - sc[1]));
  return a + Math.max(0, nt - PEAK[file] / rate + 1 / 30).toFixed(3) + b;
});
fs.writeFileSync(idx, h);
console.log("total", TOTAL, JSON.stringify(NEW_START), "voice ends", (t - 0.15).toFixed(2));
