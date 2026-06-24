import fs from "fs";
import { PDFParse } from "pdf-parse";

function needsReverse(line) {
  return /[\uFB50-\uFDFF\uFE70-\uFEFF]/.test(line);
}
function fixLine(line) {
  const t = line.trim();
  if (!t) return "";
  return needsReverse(t) ? t.split("").reverse().join("") : t;
}
function fixLines(text) {
  return text.split("\n").map(fixLine).filter(Boolean);
}

const buffer = fs.readFileSync("d:\\Downloads\\guide_2025_tp.pdf");
const parser = new PDFParse({ data: buffer });
const data = await parser.getText();
await parser.destroy();

const pages = data.text.split(/\n--\s*\d+\s+of\s+\d+\s*--\n?/);
const lines = fixLines(pages[1]); // page 1 content after header
console.log("First 40 lines page1:");
lines.slice(0, 40).forEach((l, i) => console.log(i, JSON.stringify(l)));

const bacHits = lines.filter((l) => l.includes("إعلام") || l === "علوم الإعلامية");
console.log("\nMedia bac lines:", bacHits);

const codes = lines.filter((l) => /^\d{5}$/.test(l));
console.log("\nCodes:", codes);
