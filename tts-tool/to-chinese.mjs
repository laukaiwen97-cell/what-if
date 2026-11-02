// Turns the Cantonese copy's on-screen captions into Traditional Chinese and adds
// Noto Sans HK (copied into assets/fonts) to every scene that shows Chinese.
// usage: node to-chinese.mjs <projectDir>
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.argv[2], "compositions");
const FACE = `@font-face { font-family: "Noto Sans HK"; src: url("assets/fonts/NotoSansHK-VF.ttf"); font-weight: 100 900; }\n    `;

// visible text swaps, matched as >text< so markup ids stay intact
const TEXT = {
  "s1-hook.html": [["Bayangkan esok…", "想像吓…"], ["SEMUA", "全部"], [">MAMAK</span>", ">嘛嘛檔</span>", true], ["HILANG.", "消失咗。"]],
  "s2-chat.html": [["8 ahli", "8 位成員"], ["Jom mamak?", "去唔去嘛嘛檔？"], ["Mamak mana bro?", "邊間呀 bro？"], ["Semua dah tutup??", "全部都閂晒？？"], ["24 jam pun tutup?!", "24 小時都閂？！"], ["Taip mesej…", "輸入訊息…"], ["hasil dijumpai", "個結果"]],
  "s3-day1.html": [["Match 3 pagi.", "凌晨三點睇波。"], ["Tengok mana?", "去邊度睇？"], ["Study group.", "Study group。"], ["Lepak mana?", "去邊度坐？"], ["Milo ais.", "Milo 冰。"], ["Siapa buat?", "邊個沖？"], ["Roti canai 2 pagi.", "半夜兩點 roti canai。"], ["Tak ada.", "冇喇。"]],
  "s4-tehtarik.html": [[">Tapi</span>", ">但係</span>", true], [">yang</span>", ">冇咗</span>", true], [">hilang…</span>", ">嘅…</span>", true], [">bukan</span>", ">唔只係</span>", true], [">cuma</span>", ">一杯</span>", true], [">teh tarik.</span>", ">拉茶。</span>", true]],
  "s5-year1.html": [["Semua duduk rumah.", "個個匿埋喺屋企。"], ["Scroll. Sorang-sorang.", "滑手機。一個人。"], ["1 TAHUN", "一年"], ["KEMUDIAN", "之後"], [">Teh Tarik</div>", ">拉茶</div>", true], ["Kafe baru buka.", "新 cafe 開張。"], ["Tapi tak ada yang borak.", "但冇人同隔籬枱傾偈。"], ["kat mamak dulu:", "以前嘛嘛檔：", true]],
  "s6-third.html": [[">RUMAH</text>", ">屋企</text>", true], [">KERJA</text>", ">返工</text>", true], [">MAMAK</text>", ">嘛嘛檔</text>", true], ["Ray Oldenburg panggil ni", "Ray Oldenburg 叫呢度做"], ["Tempat ketiga: tempat kita jadi", "第三個地方：我哋變成"], ["komuniti.", "社區嘅地方。"]],
  "s7-table.html": [["Kat meja mamak,", "喺嘛嘛檔張枱度，"], ["tak ada orang tanya", "冇人會問"], ["kau siapa.", "你係邊個。"], [">teh tarik</text>", ">拉茶</text>", true], [">Milo ais</text>", ">Milo 冰</text>", true]],
  "s8-ask.html": [["Kalau mamak hilang,", "如果嘛嘛檔冇咗，"], ["kau rindu makanan dia…", "你會掛住啲嘢食…"], [">atau</div>", ">定係</div>", true], ["ORANG DIA?", "嗰班人？"], ["Komen bawah", "下面留言"]],
};

for (const [file, pairs] of Object.entries(TEXT)) {
  const f = path.join(dir, file);
  let s = fs.readFileSync(f, "utf8");
  if (s.includes("NotoSansHK-VF.ttf")) { console.log("skip", file); continue; }
  for (const [from, to, exact] of pairs) {
    const needle = exact ? from : `>${from}<`;
    const repl = exact ? to : `>${to}<`;
    if (!s.includes(needle)) throw new Error(`${file}: missing ${from}`);
    s = s.split(needle).join(repl);
  }
  // fonts: CJK falls back to Noto Sans HK; display lines use its Black weight
  s = s.replace(/<style>\n(\s*)/, (m, ind) => `<style>\n${ind}${FACE}`);
  s = s.replace(/font: 400 ([\d.]+px(?:\/[\d.]+)?) "Archivo Black", sans-serif/g, `font: 900 $1 "Noto Sans HK", sans-serif`);
  s = s.replace(/Inter, sans-serif/g, `Inter, "Noto Sans HK", sans-serif`);
  s = s.replace(/font-family="Inter"/g, `font-family="Inter, Noto Sans HK"`);
  s = s.replace(/(<text[^>]*?)font-family="Archivo Black"([^>]*>(?:屋企|返工|嘛嘛檔)<)/g, `$1font-family="Noto Sans HK" font-weight="900"$2`);
  fs.writeFileSync(f, s);
  console.log("done", file);
}

// "HARI PERTAMA" title becomes 第一日 on one line
const s3 = path.join(dir, "s3-day1.html");
let t = fs.readFileSync(s3, "utf8");
const m = /<div id="s3-day">[\s\S]*?<\/div><\/div>/.exec(t);
if (!m) throw new Error("s3 title not found");
t = t.replace(m[0], `<div id="s3-day"><div class="l1"><span>第</span><span>一</span><span>日</span></div></div>`);
t = t.replace(/(#s3-day \{[^}]*font: )900 210px\/1/, "$1900 280px/1");
fs.writeFileSync(s3, t);
console.log("done title");
