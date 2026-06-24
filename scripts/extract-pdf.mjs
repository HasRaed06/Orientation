import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = "d:\\Downloads\\guide_2025_tp.pdf";
const OUT_PATH = path.join(__dirname, "..", "data", "orientations.json");

const BAC_MEDIA = "علوم الإعلامية";
const DEFAULT_BAC_PER_ORIENT = 5;
const DEFAULT_MEDIA_INDEX = 4;

const BAC_HEADERS = new Set([
  "آداب",
  "رياضيات",
  "علوم تجريبية",
  "اقتصاد وتصرف",
  "إقتصاد وتصرف",
  BAC_MEDIA,
  "العلوم التقنية",
  "رياضة",
  "العلوم الرياضية",
]);

function readable(text) {
  const t = text.trim();
  if (!t) return "";
  if (/[\uFB50-\uFDFF\uFE70-\uFEFF]/.test(t)) return t.normalize("NFKC");
  return t;
}

function fixInstitution(text) {
  return text
    .replace(/\)([^)]+)\(/g, "($1)")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isTableHeaderLine(line) {
  const r = readable(line);
  return r.includes("إجازة /") && r.includes("الشعبة") && r.includes("الرمز");
}

function isValidBigTitle(text) {
  return (
    !!text &&
    text.length >= 18 &&
    !text.startsWith("-") &&
    !text.includes("إجازة") &&
    !text.includes("=") &&
    !text.includes("+(")
  );
}

function isBigTitleHeuristic(text) {
  return (
    text.includes("العلوم") ||
    text.includes("الآداب") ||
    text.includes("الهندسة") ||
    text.includes("الثقافة") ||
    text.includes("السياحة") ||
    text.startsWith("علوم ") ||
    text.includes("الفنون") ||
    text.includes("القانون")
  );
}

function readCategoryAfterHeader(rest) {
  for (let i = 0; i < rest.length; i++) {
    if (!isTableHeaderLine(rest[i])) continue;
    const cat = readable(rest[i + 1] ?? "");
    if (isValidBigTitle(cat) && isBigTitleHeuristic(cat)) return cat;
    return null;
  }
  return null;
}

function isBacHeader(line) {
  return BAC_HEADERS.has(readable(line));
}

function isInstitutionStart(text) {
  return (
    text.startsWith("كلية") ||
    text.startsWith("المعهد") ||
    text.startsWith("معهد") ||
    text.startsWith("المدرسة") ||
    text.startsWith("مركز") ||
    text.startsWith("مؤسسة")
  );
}

function isInstitutionContinuation(text) {
  if (!text || isInstitutionStart(text) || text.startsWith("-")) return false;
  return (
    /جامعة/.test(text) ||
    text.endsWith(")") ||
    /^.+\)$/.test(text) ||
    /^ال/.test(text)
  );
}

function isScoreLine(line) {
  return /^[\d.\-]+$/.test(line) || line === "-";
}

function isFormulaLine(line) {
  return /^F[GM]/.test(line) || (line.includes("FG") && line.includes("+"));
}

function getGuidePageNumber(lines, pdfPageNumber) {
  if (lines.length > 0 && /^\d{1,3}$/.test(lines[0])) {
    return parseInt(lines[0], 10);
  }
  return pdfPageNumber - 1;
}

function findBacHeadersBefore(lines, codeStartIndex) {
  const bacs = [];
  let i = codeStartIndex - 1;
  while (i >= 0 && isBacHeader(lines[i])) {
    bacs.unshift(readable(lines[i]));
    i--;
  }
  return bacs;
}

function findCodeBlocks(lines) {
  const blocks = [];

  for (let i = 0; i < lines.length; i++) {
    if (/^\d{5}$/.test(lines[i])) {
      const codes = [];
      const startIndex = i;
      while (i < lines.length && /^\d{5}$/.test(lines[i])) {
        codes.push(lines[i]);
        i++;
      }
      blocks.push({
        codes,
        startIndex,
        rest: lines.slice(i),
        bacHeaders: findBacHeadersBefore(lines, startIndex),
      });
      continue;
    }

    const embedded = lines[i].match(/^(\d{5})\s+(.+)$/);
    if (embedded) {
      blocks.push({
        codes: [embedded[1]],
        startIndex: i,
        rest: lines.slice(i + 1),
        embeddedInstitution: readable(embedded[2]),
        bacHeaders: findBacHeadersBefore(lines, i),
      });
    }
  }

  return blocks;
}

function parseInstitutionsInOrder(rest, count, embeddedFirst) {
  const institutions = [];
  let i = 0;

  if (embeddedFirst) {
    institutions.push(fixInstitution(embeddedFirst));
  }

  while (institutions.length < count && i < rest.length) {
    const r = readable(rest[i]);

    if (isInstitutionStart(r)) {
      let inst = r;
      i++;
      if (i < rest.length) {
        const nxt = readable(rest[i]);
        if (isInstitutionContinuation(nxt)) {
          inst += " " + nxt;
          i++;
        }
      }
      institutions.push(fixInstitution(inst));
      continue;
    }

    if (r.startsWith("-") || isTableHeaderLine(rest[i]) || isScoreLine(rest[i])) {
      break;
    }

    i++;
  }

  return { institutions, nextIndex: i };
}

function parseSpecsInOrder(rest, startIndex, count) {
  const specs = [];
  let i = startIndex;

  while (specs.length < count && i < rest.length) {
    const r = readable(rest[i]);
    if (r.startsWith("-")) {
      specs.push(r.replace(/^-/, "").trim());
      i++;
    } else {
      break;
    }
  }

  return { specs, nextIndex: i };
}

function parseDegreesInOrder(rest, startIndex) {
  const degrees = [];
  let i = startIndex;

  while (i < rest.length) {
    const r = readable(rest[i]);

    if (isTableHeaderLine(rest[i]) || isScoreLine(rest[i]) || isFormulaLine(rest[i])) {
      break;
    }
    if (r.startsWith("-")) break;
    if (r.includes("شعبة تتطلب") || r.includes("تربية بدنية إجبارية") || r.startsWith("(*)")) {
      i++;
      continue;
    }
    if (r.includes("إجازة")) {
      let degree = r;
      i++;
      if (i < rest.length) {
        const next = readable(rest[i]);
        if (
          !next.includes("إجازة") &&
          !isTableHeaderLine(rest[i]) &&
          !/سنوات|أمد/.test(next) &&
          !next.startsWith("شعبة") &&
          !isInstitutionStart(next)
        ) {
          degree += " " + next;
          i++;
        }
      }
      if (i < rest.length && /سنوات|أمد/.test(readable(rest[i]))) i++;
      degrees.push(degree);
      continue;
    }

    if (isInstitutionStart(r)) break;
    i++;
  }

  return { degrees, nextIndex: i };
}

function parseScoresFormulasCapacities(rest, startIndex) {
  let i = startIndex;
  let blockCategory = null;

  while (i < rest.length) {
    if (isTableHeaderLine(rest[i])) {
      const cat = readable(rest[i + 1] ?? "");
      if (isValidBigTitle(cat) && isBigTitleHeuristic(cat)) {
        blockCategory = cat;
      }
      i += 2;
      break;
    }
    i++;
  }

  const scores = [];
  while (i < rest.length) {
    const line = rest[i];
    if (readable(line).startsWith("صيغة احتساب") || line.startsWith("ﺻﻴﻐﺔ")) break;
    if (isScoreLine(line)) {
      scores.push(line);
      i++;
      continue;
    }
    if (isFormulaLine(line) || line.startsWith("ﻃﺎﻗﺔ") || readable(line).startsWith("طاقة")) {
      break;
    }
    if (readable(line).includes("يتعين على")) break;
    i++;
  }

  const formulas = [];
  if (i < rest.length && (readable(rest[i]).startsWith("صيغة احتساب") || rest[i].startsWith("ﺻﻴﻐﺔ"))) {
    i++;
  }
  while (i < rest.length) {
    const line = rest[i];
    if (line.startsWith("ﻃﺎﻗﺔ") || readable(line).startsWith("طاقة")) break;
    if (isFormulaLine(line)) {
      formulas.push(line);
      i++;
    } else if (/^\d+$/.test(line)) {
      break;
    } else if (/^\d{5}$/.test(line) || isBacHeader(line)) {
      break;
    } else {
      i++;
    }
  }

  const capacities = [];
  while (i < rest.length) {
    const line = rest[i];
    if (/^\d+$/.test(line)) {
      capacities.push(parseInt(line, 10));
      i++;
    } else if (
      line.startsWith("ﻃﺎﻗﺔ") ||
      readable(line).startsWith("طاقة") ||
      /^\d{5}$/.test(line) ||
      isBacHeader(line)
    ) {
      break;
    } else {
      i++;
    }
  }

  return { scores, formulas, capacities, category: blockCategory };
}

function pickDegree(degrees, index) {
  if (!degrees.length) return "";
  if (degrees[index]) return degrees[index];
  if (degrees.length === 1) return degrees[0];
  return degrees[Math.min(index, degrees.length - 1)];
}

function getMediaScore(scores, instIndex, bacPerOrient, mediaIndex) {
  const groupStart = instIndex * bacPerOrient;
  const group = scores.slice(groupStart, groupStart + bacPerOrient);
  if (group[mediaIndex] !== undefined && group[mediaIndex] !== "-") {
    return group[mediaIndex];
  }
  const nonDash = group.filter((s) => s !== "-");
  if (nonDash.length > 0) return nonDash[nonDash.length - 1];
  return group[mediaIndex] ?? "-";
}

function parseBlock(block, defaultCategory, guidePage, blockIndex) {
  const { codes, rest, bacHeaders, embeddedInstitution } = block;
  const n = codes.length;
  if (n === 0) return [];

  let bacPerOrient = DEFAULT_BAC_PER_ORIENT;
  let mediaIndex = DEFAULT_MEDIA_INDEX;

  if (bacHeaders.length > 0 && bacHeaders.length % n === 0) {
    bacPerOrient = bacHeaders.length / n;
    const group = bacHeaders.slice(0, bacPerOrient);
    if (group.includes(BAC_MEDIA)) {
      mediaIndex = group.indexOf(BAC_MEDIA);
    }
  }

  const { institutions, nextIndex: afterInst } = parseInstitutionsInOrder(
    rest,
    n,
    embeddedInstitution
  );
  if (institutions.length < n) return [];

  const { specs, nextIndex: afterSpecs } = parseSpecsInOrder(rest, afterInst, n);
  const { degrees, nextIndex: afterDegrees } = parseDegreesInOrder(rest, afterSpecs);
  const { scores, formulas, capacities, category: blockCategory } =
    parseScoresFormulasCapacities(rest, afterDegrees);

  const category = blockCategory || defaultCategory || "غير مصنف";

  const minScores = (n - 1) * bacPerOrient + 1;
  if (scores.length < minScores) return [];

  const entries = [];
  for (let i = 0; i < n; i++) {
    const scoreRaw = getMediaScore(scores, i, bacPerOrient, mediaIndex);
    const scoreNum = scoreRaw !== "-" ? parseFloat(scoreRaw) : null;
    const formula = formulas[i * bacPerOrient + mediaIndex] ?? formulas[i] ?? "";

    const capStart = i * bacPerOrient * 3 + mediaIndex * 3;
    const capacity =
      capStart + 2 < capacities.length && capacities[capStart] >= 5
        ? {
            total: capacities[capStart],
            male: capacities[capStart + 1],
            female: capacities[capStart + 2],
          }
        : null;

    entries.push({
      code: codes[i],
      page: guidePage,
      order: blockIndex * 100 + i,
      category,
      institution: institutions[i],
      degree: pickDegree(degrees, i),
      specialization: specs[i] ?? "",
      bac_type: BAC_MEDIA,
      last_guided_total_2024: Number.isFinite(scoreNum) ? scoreNum : null,
      last_guided_display: scoreRaw,
      score_formula: formula,
      capacity,
    });
  }

  return entries;
}

async function main() {
  const buffer = fs.readFileSync(PDF_PATH);
  const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();
  await parser.destroy();

  let currentCategory = null;
  const all = [];

  for (const { text: pageText, num: pdfPageNumber } of data.pages) {
    const lines = pageText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const guidePage = getGuidePageNumber(lines, pdfPageNumber);
    const contentLines = /^\d{1,3}$/.test(lines[0]) ? lines.slice(1) : lines;

    const pageCategory = readCategoryAfterHeader(contentLines);
    if (pageCategory) currentCategory = pageCategory;

    const blocks = findCodeBlocks(contentLines);
    blocks.forEach((block, blockIndex) => {
      const entries = parseBlock(block, currentCategory, guidePage, blockIndex);
      for (const entry of entries) {
        if (entry.category && entry.category !== "غير مصنف") {
          currentCategory = entry.category;
        }
        all.push(entry);
      }
    });
  }

  all.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return a.order - b.order;
  });

  const seen = new Set();
  const output = [];
  for (const { order, ...entry } of all) {
    const key = `${entry.code}|${entry.page}|${entry.institution}|${entry.specialization}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(entry);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf-8");

  console.log(`Extracted ${output.length} orientations`);
  console.log("Page range:", output[0]?.page, "-", output[output.length - 1]?.page);
  console.log("Categories:", [...new Set(output.map((e) => e.category))].length);
  console.log("With score:", output.filter((e) => e.last_guided_total_2024 != null).length);
  if (output[0]) console.log("First:", JSON.stringify(output[0], null, 2));
}

main().catch(console.error);
