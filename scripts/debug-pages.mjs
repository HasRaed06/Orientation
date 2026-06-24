import fs from "fs";
import { PDFParse } from "pdf-parse";

const buf = fs.readFileSync("d:/Downloads/guide_2025_tp.pdf");
const p = new PDFParse({ data: buf });
const d = await p.getText();
await p.destroy();

function readable(t) {
  const s = t.trim();
  return /[\uFB50-\uFDFF\uFE70-\uFEFF]/.test(s) ? s.normalize("NFKC") : s;
}

const page = d.pages.find((p) => p.num === 50);
const lines = page.text.split("\n").map((l) => l.trim()).filter(Boolean);
console.log("guide page", lines[0]);
const content = lines.slice(1);

// find first code block
let i = content.findIndex((l) => /^\d{5}$/.test(l));
const codes = [];
let k = i;
while (k < content.length && /^\d{5}$/.test(content[k])) {
  codes.push(content[k]);
  k++;
}
const rest = content.slice(k);
console.log("codes", codes);

let inst = 0;
for (const l of rest) {
  const r = readable(l);
  if (r.startsWith("كلية") || r.startsWith("المعهد") || r.startsWith("المدرسة")) inst++;
}
console.log("institutions rough", inst);

const catIdx = rest.findIndex((l) => l.includes("ﺍﻟﻌﻠﻮﻡ") || readable(l).includes("العلوم"));
const afterCat = rest.slice(catIdx + 1);
const formulaIdx = afterCat.findIndex((l) => l.startsWith("ﺻﻴﻐﺔ"));
const scores = afterCat.slice(0, formulaIdx).filter((l) => /^[\d.\-]+$/.test(l) || l === "-");
console.log("scores", scores.length, "need", codes.length * 5);
console.log("first inst media score idx4:", scores[4]);
console.log("bac headers count", content.filter((l) => readable(l) === "علوم الإعلامية").length);
