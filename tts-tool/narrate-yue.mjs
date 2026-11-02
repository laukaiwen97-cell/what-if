// Cantonese narration, generated phrase by phrase with its own pitch and pace.
// usage: node narrate-yue.mjs <voice> <outDir> [scene,scene,...]
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "node:fs";
import path from "node:path";

const voice = process.argv[2] || "zh-HK-HiuMaanNeural";
const outDir = process.argv[3] || "out";
const only = process.argv[4] ? process.argv[4].split(",") : null;

// [text, rate, pitch] or a number = pause in ms
const S = (t, r = "+0%", p = "+0Hz") => [t, r, p];
const scenes = {
  "nv-1": [S("想像吓…", "-12%", "-4Hz"), 250, S("聽朝你一起身。", "+0%"), 300, S("成個馬來西亞嘅嘛嘛檔…", "-5%", "+3Hz"), 250, S("全部消失咗。", "-18%", "-10Hz")],
  "nv-2": [S("Group chat 即刻亂晒。", "+10%", "+6Hz"), 150, S("去唔去嘛嘛檔呀？", "+12%", "+14Hz"), 120, S("邊間嘛嘛檔呀？", "+12%", "+18Hz"), 250, S("一間都搵唔到。", "-6%", "-8Hz")],
  "nv-3": [S("第一日。", "-6%", "+2Hz"), 200, S("凌晨三點睇波，去邊度睇？", "+10%", "+10Hz"), 150, S("Study group，去邊度坐？", "+10%", "+10Hz"), 150, S("Milo冰…邊個幫你沖？", "+6%", "+12Hz"), 150, S("半夜兩點想食 roti canai…", "+4%", "+2Hz"), 200, S("冇喇。", "-15%", "-10Hz")],
  "nv-4": [S("但係慢慢…", "-15%", "-6Hz"), 300, S("我哋先開始發覺。", "-12%", "-4Hz"), 350, S("冇咗嘅…", "-15%", "-2Hz"), 250, S("唔只係一杯拉茶。", "-18%", "-10Hz")],
  "nv-5": [S("一年之後。", "-8%", "-4Hz"), 200, S("個個都匿埋喺屋企。", "+2%"), 150, S("滑手機…", "-10%"), 150, S("一個人。", "-12%", "-6Hz"), 250, S("新 cafe 一間接一間咁開。", "+8%", "+6Hz"), 120, S("一杯拉茶，十二蚊。", "+4%", "+10Hz"), 250, S("但係再冇人同隔籬枱傾偈。", "-6%", "-6Hz")],
  "nv-6": [S("社會學家 Ray Oldenburg 叫呢啲地方做…", "+2%", "+2Hz"), 200, S("third place。", "-14%", "+8Hz"), 250, S("屋企，係第一個地方。", "+4%"), 120, S("返工，係第二個。", "+4%"), 250, S("而第三個地方…", "-10%", "+4Hz"), 200, S("就係我哋變成一個社區嘅地方。", "-6%", "-4Hz")],
  "nv-7": [S("喺嘛嘛檔張枱度，", "-4%", "+4Hz"), 100, S("冇人會問你係邊個。", "-6%", "-2Hz"), 250, S("拉茶。", "+6%", "+8Hz"), 80, S("Kopi O。", "+6%", "+8Hz"), 80, S("Milo。", "+6%", "+8Hz"), 80, S("Bandung。", "+6%", "+8Hz"), 220, S("全部坐埋一枱。", "-10%", "-6Hz")],
  "nv-8": [S("所以我想問吓你。", "-4%", "+2Hz"), 250, S("如果聽日嘛嘛檔真係冇晒…", "-6%", "+4Hz"), 250, S("你會掛住佢啲嘢食…", "-4%", "+6Hz"), 300, S("定係掛住嗰班人？", "-14%", "+12Hz"), 400, S("喺下面留言話我知。", "+4%", "-2Hz")],
};

fs.mkdirSync(outDir, { recursive: true });
const cache = path.join(outDir, "phrases");
fs.mkdirSync(cache, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const manifest = {};
for (const [name, parts] of Object.entries(scenes)) {
  if (only && !only.includes(name)) continue;
  manifest[name] = [];
  let i = 0;
  for (const p of parts) {
    if (typeof p === "number") { manifest[name].push({ pause: p }); continue; }
    const file = path.join(cache, name + "-" + String(i++).padStart(2, "0") + ".mp3");
    manifest[name].push({ file });
    if (fs.existsSync(file)) continue;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await wait(attempt ? 30000 : 3500);
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
        const tmp = file + "-tmp";
        fs.mkdirSync(tmp, { recursive: true });
        const { audioFilePath } = await tts.toFile(tmp, p[0], { rate: p[1], pitch: p[2] });
        fs.renameSync(audioFilePath, file);
        fs.rmSync(tmp, { recursive: true, force: true });
        tts.close();
        console.log("phrase", path.basename(file));
        break;
      } catch (e) { console.log("retry", path.basename(file), String(e.message).slice(0, 60)); }
    }
  }
}
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log("done");
