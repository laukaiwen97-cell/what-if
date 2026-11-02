// Re-times a language copy whose scenes are already synced to the Malay narration:
// each scene is mapped phrase-for-phrase from the Malay timings onto the new voice.
// usage: node retime-lang.mjs <projectDir> <newVoDir>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dir = process.argv[2];
const voDir = process.argv[3];
const voRel = path.relative(dir, voDir).replace(/\\/g, "/");
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

const order = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
const FILES = { s1: "s1-hook.html", s2: "s2-chat.html", s3: "s3-day1.html", s4: "s4-tehtarik.html", s5: "s5-year1.html", s6: "s6-third.html", s7: "s7-table.html", s8: "s8-ask.html" };
const VO = order.map((_, i) => `nv-${i + 1}`);

// the Malay layout this copy was synced to
const M_START = { s1: 0, s2: 7, s3: 11.4, s4: 22.8, s5: 29.75, s6: 43.75, s7: 56.9, s8: 65.25 };
const M_DUR = { s1: 7, s2: 4.4, s3: 11.4, s4: 6.95, s5: 14, s6: 13.15, s7: 8.35, s8: 11.5 };
const mTiming = JSON.parse(fs.readFileSync(path.join(dir, "assets/vo-narr/timing.json"), "utf8"));
const cTiming = JSON.parse(fs.readFileSync(path.join(voDir, "timing.json"), "utf8"));
const mTotal = VO.map((k) => dur(path.join(dir, "assets/vo-narr", k + ".mp3")));
const cTotal = VO.map((k) => dur(path.join(voDir, k + ".mp3")));

// voice starts: continuous with a 0.15 s breath
const mV = [], cV = [];
let a = 0.25, b = 0.25;
for (let i = 0; i < 8; i++) { mV.push(a); cV.push(b); a += mTotal[i] + 0.15; b += cTotal[i] + 0.15; }

// each scene keeps its lead (voice start minus scene start); the last keeps its tail
const C_START = {}, C_DUR = {}, F = {};
order.forEach((s, i) => { C_START[s] = +(cV[i] - (mV[i] - M_START[s])).toFixed(3); });
C_START.s1 = 0;
order.forEach((s, i) => {
  const next = i < 7 ? C_START[order[i + 1]] : cV[7] + cTotal[7] + (M_START.s8 + M_DUR.s8 - (mV[7] + mTotal[7]));
  C_DUR[s] = +(next - C_START[s]).toFixed(3);
  const leadM = mV[i] - M_START[s], leadC = cV[i] - C_START[s];
  const pts = [[0, 0]];
  mTiming[VO[i]].forEach((p, k) => pts.push([leadM + p.start, leadC + cTiming[VO[i]][k].start]));
  pts.push([leadM + mTotal[i], leadC + cTotal[i]], [M_DUR[s], C_DUR[s]]);
  const clean = [];
  for (const p of pts.sort((x, y) => x[0] - y[0])) if (p[0] >= 0 && p[1] >= 0 && (!clean.length || (p[0] > clean.at(-1)[0] && p[1] > clean.at(-1)[1]))) clean.push(p);
  F[s] = clean;
});
const lerp = (m, t) => {
  for (let i = 1; i < m.length; i++) { const [a0, b0] = m[i - 1], [a1, b1] = m[i]; if (t <= a1) return b0 + ((t - a0) * (b1 - b0)) / (a1 - a0); }
  const [x, y] = m.at(-1); return y + (t - x);
};

// scenes: push every anchor's target through the scene's Malay->Cantonese map
for (const s of order) {
  const f = path.join(dir, "compositions", FILES[s]);
  let src = fs.readFileSync(f, "utf8");
  const m = /const MAPK = (\[.*?\]);/.exec(src);
  if (!m) throw new Error("no MAPK in " + s);
  const mk = JSON.parse(m[1]).map(([o, n]) => [o, +lerp(F[s], n).toFixed(3)]);
  src = src.replace(m[0], `const MAPK = ${JSON.stringify(mk)};`);
  src = src.replace(/\{ p: 1, duration: [\d.]+, ease: "none"/, `{ p: 1, duration: 60, ease: "none"`);
  fs.writeFileSync(f, src);
}

// index: slots, length, voice, sound effects
const idx = path.join(dir, "index.html");
let h = fs.readFileSync(idx, "utf8");
for (const s of order) {
  const re = new RegExp(`(id="${s}"[^>]*?)data-start="[\\d.]+" data-duration="[\\d.]+"`);
  if (!re.test(h)) throw new Error("no host " + s);
  h = h.replace(re, `$1data-start="${C_START[s]}" data-duration="${C_DUR[s]}"`);
}
const TOTAL = +(C_START.s8 + C_DUR.s8).toFixed(3);
h = h.replace(/(id="root"[^>]*?)data-duration="[\d.]+"/, `$1data-duration="${TOTAL}"`);
h = h.replace(/i < \d+ \* 12/, `i < ${Math.ceil(TOTAL) + 1} * 12`);
VO.forEach((k, i) => {
  const re = new RegExp(`(<audio[^>]*?id="vo-${i + 1}"[^>]*?)src="[^"]*" data-start="[^"]*" data-duration="[^"]*"`);
  if (!re.test(h)) throw new Error("no vo " + (i + 1));
  h = h.replace(re, `$1src="${voRel}/${k}.mp3" data-start="${cV[i].toFixed(3)}" data-duration="${cTotal[i].toFixed(3)}"`);
});
h = h.replace(/<!-- VOICE:[^\n]*-->/, "<!-- VOICE: zh-HK HiuMaan neural, Cantonese narration -->");
const PEAK = { sfx_001: 0.162, sfx_002: 0.12, sfx_003: 0.229, sfx_004: 0.745, sfx_006: 0.073 };
h = h.replace(/(<audio[^>]*?id="sfx-[^"]*"[^>]*src="assets\/sfx\/(sfx_\d+)\.mp3"[^>]*?data-start=")([\d.]+)("[^>]*>)/g, (all, pre, file, st, post) => {
  const rate = parseFloat((all.match(/data-playback-rate="([\d.]+)"/) || [0, 1])[1]);
  const pic = parseFloat(st) + PEAK[file] / rate - 1 / 30;
  let sc = "s1";
  for (const s of order) if (pic >= M_START[s] - 0.05) sc = s;
  const nt = C_START[sc] + lerp(F[sc], Math.max(0, pic - M_START[sc]));
  return pre + Math.max(0, nt - PEAK[file] / rate + 1 / 30).toFixed(3) + post;
});
fs.writeFileSync(idx, h);
console.log("total", TOTAL, JSON.stringify(C_START), "voice ends", (b - 0.15).toFixed(2));
