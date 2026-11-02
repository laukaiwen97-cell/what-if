// Narrative-style Malay VO: per-phrase pitch/rate and real pauses, one clip per scene.
// usage: node narrate.mjs <voice> <outDir>
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "node:fs";
import path from "node:path";

const voice = process.argv[2] || "ms-MY-YasminNeural";
const outDir = process.argv[3] || "out";

// [text, rate, pitch] or a number = pause in ms
const S = (t, r = "+0%", p = "+0Hz") => [t, r, p];
const scenes = {
  "nv-1": [S("Bayangkan…", "-12%", "-4Hz"), 250, S("esok pagi kau bangun.", "+0%"), 300, S("Dan semua mamak kat Malaysia…", "-5%", "+3Hz"), 250, S("lenyap.", "-18%", "-10Hz")],
  "nv-2": [S("Group chat terus kecoh.", "+10%", "+6Hz"), 150, S("Jom mamak?", "+12%", "+14Hz"), 120, S("Mamak mana?", "+12%", "+18Hz"), 250, S("Satu pun tak jumpa.", "-6%", "-8Hz")],
  "nv-3": [S("Hari pertama.", "-6%", "+2Hz"), 200, S("Match pukul tiga pagi, nak tengok kat mana?", "+10%", "+10Hz"), 150, S("Study group, nak lepak mana?", "+10%", "+10Hz"), 150, S("Milo ais… siapa nak bancuh?", "+6%", "+12Hz"), 150, S("Roti canai pukul dua pagi…", "+4%", "+2Hz"), 200, S("tak ada.", "-15%", "-10Hz")],
  "nv-4": [S("Tapi lama-lama…", "-15%", "-6Hz"), 300, S("kita mula sedar.", "-12%", "-4Hz"), 350, S("Yang hilang…", "-15%", "-2Hz"), 250, S("bukan cuma teh tarik.", "-18%", "-10Hz")],
  "nv-5": [S("Setahun berlalu.", "-8%", "-4Hz"), 200, S("Semua orang duduk rumah.", "+2%"), 150, S("Scroll…", "-10%"), 150, S("sorang-sorang.", "-12%", "-6Hz"), 250, S("Kafe baru tumbuh macam cendawan.", "+8%", "+6Hz"), 120, S("Teh tarik, dua belas ringgit.", "+4%", "+10Hz"), 250, S("Tapi tak ada siapa lagi berborak dengan meja sebelah.", "-6%", "-6Hz")],
  "nv-6": [S("Ahli sosiologi Ray Oldenburg panggil ni…", "+2%", "+2Hz"), 200, S("third place.", "-14%", "+8Hz"), 250, S("Rumah, tempat pertama.", "+4%"), 120, S("Kerja, tempat kedua.", "+4%"), 250, S("Dan tempat ketiga…", "-10%", "+4Hz"), 200, S("tempat kita jadi sebahagian daripada komuniti.", "-6%", "-4Hz")],
  "nv-7": [S("Kat meja mamak,", "-4%", "+4Hz"), 100, S("tak ada orang tanya kau siapa.", "-6%", "-2Hz"), 250, S("Teh tarik.", "+6%", "+8Hz"), 80, S("Kopi O.", "+6%", "+8Hz"), 80, S("Milo.", "+6%", "+8Hz"), 80, S("Bandung.", "+6%", "+8Hz"), 220, S("Semua duduk satu meja.", "-10%", "-6Hz")],
  "nv-8": [S("Jadi aku nak tanya kau.", "-4%", "+2Hz"), 250, S("Kalau esok mamak betul-betul hilang…", "-6%", "+4Hz"), 250, S("kau rindu makanan dia…", "-4%", "+6Hz"), 300, S("atau orang dia?", "-14%", "+12Hz"), 400, S("Tulis kat komen.", "+4%", "-2Hz")],
};

fs.mkdirSync(outDir, { recursive: true });
const cache = path.join(outDir, "phrases");
fs.mkdirSync(cache, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const manifest = {};
for (const [name, parts] of Object.entries(scenes)) {
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
