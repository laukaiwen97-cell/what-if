// Generates one Malay VO clip per scene with Microsoft's neural voice.
// usage: node gen.mjs <voice> <outDir>
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "node:fs";
import path from "node:path";

const voice = process.argv[2] || "ms-MY-OsmanNeural";
const outDir = process.argv[3] || "out";

const lines = [
  ["vo-1", "Bayangkan esok kau bangun… dan semua mamak, hilang.", "+0%"],
  ["vo-2", "Group chat mula panik. Jom mamak? Tak ada jawapan.", "+5%"],
  ["vo-3", "Hari pertama. Match pukul tiga pagi, nak tengok mana? Study group, nak lepak mana? Milo ais, siapa nak buat?", "+8%"],
  ["vo-4", "Tapi lama-lama, kita sedar… yang hilang, bukan cuma teh tarik.", "-5%"],
  ["vo-5", "Setahun kemudian. Semua orang duduk rumah. Scroll. Sorang-sorang. Kafe baru buka, teh tarik dua belas ringgit. Tapi tak ada siapa borak dengan meja sebelah.", "+10%"],
  ["vo-6", "Ahli sosiologi Ray Oldenburg panggil benda ni, tempat ketiga. Rumah, tempat pertama. Kerja, tempat kedua. Dan tempat ketiga, tempat kita jadi sebahagian dari komuniti.", "+8%"],
  ["vo-7", "Kat meja mamak, tak ada orang tanya kau siapa. Teh tarik, kopi O, Milo, bandung. Semua satu meja.", "+0%"],
  ["vo-8", "Jadi soalan aku. Kalau mamak hilang, kau rindu makanan dia… atau orang dia? Komen bawah.", "-3%"],
  ["vo-9", "Esok. Kalau Grab, tiba-tiba hilang.", "+0%"],
];

fs.mkdirSync(outDir, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const [name, text, rate] of lines) {
  if (fs.existsSync(path.join(outDir, name + ".mp3"))) continue;
  await wait(6000);
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const tmp = path.join(outDir, name + "-tmp");
  fs.mkdirSync(tmp, { recursive: true });
  const { audioFilePath } = await tts.toFile(tmp, text, { rate });
  fs.renameSync(audioFilePath, path.join(outDir, name + ".mp3"));
  fs.rmSync(tmp, { recursive: true, force: true });
  tts.close();
  console.log("wrote", name);
}
