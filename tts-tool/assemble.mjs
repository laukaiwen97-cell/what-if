// Joins narrated phrases into one clip per scene: trims each phrase's silent edges,
// inserts the scripted pauses, levels the result, and records when every phrase starts.
// usage: node assemble.mjs <voDir>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dir = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
const work = path.join(dir, "work");
fs.mkdirSync(work, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const trim = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,aresample=44100";

const timing = {};
for (const [name, parts] of Object.entries(manifest)) {
  const list = [];
  let t = 0;
  timing[name] = [];
  parts.forEach((p, i) => {
    const out = path.join(work, `${name}-${String(i).padStart(2, "0")}.wav`);
    if (p.pause) ff(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(p.pause / 1000), out]);
    else ff(["-i", p.file, "-af", trim, "-ac", "1", out]);
    const d = dur(out);
    if (!p.pause) timing[name].push({ start: +t.toFixed(3), end: +(t + d).toFixed(3) });
    t += d;
    list.push(`file '${out.replace(/\\/g, "/")}'`);
  });
  const listFile = path.join(work, name + ".txt");
  fs.writeFileSync(listFile, list.join("\n"));
  const raw = path.join(work, name + "-raw.wav");
  ff(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", raw]);
  ff(["-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-b:a", "160k", path.join(dir, name + ".mp3")]);
  timing[name].total = +dur(path.join(dir, name + ".mp3")).toFixed(3);
}
fs.writeFileSync(path.join(dir, "timing.json"), JSON.stringify(timing, null, 1));
for (const [k, v] of Object.entries(timing)) console.log(k, v.total, v.map((x) => x.start).join(" "));
