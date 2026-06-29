const BAC_TYPES = [
  { id: "math", label: "\u0631\u064A\u0627\u0636\u064A\u0627\u062A", file: "orientations_math.json" },
  { id: "sci", label: "\u0639\u0644\u0648\u0645 \u062A\u062C\u0631\u064A\u0628\u064A\u0629", file: "orientations_sci.json" },
  { id: "eco", label: "\u0627\u0642\u062A\u0635\u0627\u062F \u0648\u062A\u0635\u0631\u0641", file: "orientations_eco.json" },
  { id: "let", label: "\u0622\u062F\u0627\u0628", file: "orientations_let.json" },
  { id: "info", label: "\u0639\u0644\u0648\u0645 \u0627\u0644\u0625\u0639\u0644\u0627\u0645\u064A\u0629", file: "orientations_info.json" },
  { id: "tech", label: "\u0639\u0644\u0648\u0645 \u0627\u0644\u062A\u0642\u0646\u064A\u0629", file: "orientations_tech.json" },
  { id: "sp", label: "\u0631\u064A\u0627\u0636\u0629", file: "orientations_sp.json" },
];

const params = new URLSearchParams(location.search);
const bacId = params.get("bac");

const bac = BAC_TYPES.find((b) => b.id === bacId);
if (!bac) {
  location.replace("bac-selector.html");
}

const els = {
  appTitle: document.getElementById("appTitle"),
  stats: document.getElementById("stats"),
  categoryFilter: document.getElementById("categoryFilter"),
  scoreMode: document.getElementById("scoreMode"),
  scoreValue: document.getElementById("scoreValue"),
  sortOrder: document.getElementById("sortOrder"),
  searchInput: document.getElementById("searchInput"),
  filterBtn: document.getElementById("filterBtn"),
  resetBtn: document.getElementById("resetBtn"),
  results: document.getElementById("results"),
  resultsCount: document.getElementById("resultsCount"),
  emptyState: document.getElementById("emptyState"),
};

let data = [];

(async function init() {
  try {
    const resp = await fetch("./data/" + bac.file);
    data = await resp.json();
  } catch {
    //alert("\u0641\u0634\u0644 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. \u062A\u0623\u0643\u062F \u0645\u0646 \u0648\u062C\u0648\u062F \u0627\u0644\u0645\u0644\u0641.");
    location.replace("bac-selector.html");
    return;
  }

  document.title = "\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0648\u062C\u064A\u0647 \u2014 \u0628\u0643\u0627\u0644\u0648\u0631\u064A\u0627 " + bac.label;
  els.appTitle.textContent = "\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0648\u062C\u064A\u0647 \u2014 \u0628\u0643\u0627\u0644\u0648\u0631\u064A\u0627 " + bac.label;
  initFilters();
  render();
  bindEvents();

  try {
    const { AdMob } = Capacitor.Plugins;
    await AdMob.initialize({});
    await AdMob.showBanner({
      adId: "ca-app-pub-3940256099942544/6300978111",
      isTesting: true,
      position: "BOTTOM_CENTER",
      adSize: "BANNER",
    });
  } catch {
    // Capacitor not available (browser dev), skip ads
  }
})();

function initFilters() {
  const categories = [...new Set(data.map((d) => d.category))].sort();
  els.categoryFilter.innerHTML = '<option value="">\u0643\u0644 \u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062A</option>';
  for (const cat of categories) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    els.categoryFilter.appendChild(opt);
  }

  const withScore = data.filter((d) => d.last_guided_total_2025 != null);
  const scores = withScore.map((d) => d.last_guided_total_2025);
  const min = scores.length ? Math.min(...scores).toFixed(2) : "\u2014";
  const max = scores.length ? Math.max(...scores).toFixed(2) : "\u2014";

  els.stats.innerHTML = [
    '<div class="stat"><strong>' + data.length + '</strong><span>\u062E\u064A\u0627\u0631</span></div>',
    '<div class="stat"><strong>' + categories.length + '</strong><span>\u0642\u0637\u0627\u0639</span></div>',
    '<div class="stat"><strong>' + min + ' \u2013 ' + max + '</strong><span>\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062C\u0627\u0645\u064A\u0639</span></div>',
  ].join("");
}

function getFilters() {
  return {
    category: els.categoryFilter.value,
    scoreMode: els.scoreMode.value,
    scoreValue: els.scoreValue.value ? parseFloat(els.scoreValue.value) : null,
    sortOrder: els.sortOrder.value,
    search: els.searchInput.value.trim().toLowerCase(),
  };
}

function matchesFilters(item, filters) {
  if (filters.category && item.category !== filters.category) return false;

  if (filters.scoreMode && filters.scoreValue != null) {
    const score = item.last_guided_total_2025;
    if (score == null) return false;
    if (filters.scoreMode === "gte" && score < filters.scoreValue) return false;
    if (filters.scoreMode === "lte" && score > filters.scoreValue) return false;
  }

  if (filters.search) {
    const haystack = [
      item.institution,
      item.degree,
      item.specialization,
      item.category,
      item.code,
      item.score_formula,
      item.page != null ? String(item.page) : "",
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(filters.search)) return false;
  }

  return true;
}

function renderCard(item) {
  const score =
    item.last_guided_total_2025 != null
      ? item.last_guided_total_2025.toFixed(2)
      : item.last_guided_display || "\u2014";

  const scoreClass =
    item.last_guided_total_2025 == null
      ? "score score-muted"
      : item.last_guided_total_2025 >= 110
        ? "score score-high"
        : item.last_guided_total_2025 >= 95
          ? "score score-mid"
          : "score";

  return [
    '<article class="card orientation-card">',
    '  <div class="card-top">',
    '    <span class="badge">' + item.category + '</span>',
    '    <span class="' + scoreClass + '" title="\u0645\u062C\u0645\u0648\u0639 \u0622\u062E\u0631 \u0645\u0648\u062C\u0647 2025">' + score + '</span>',
    '  </div>',
    '  <h3 class="institution">' + (item.institution || "\u2014") + '</h3>',
    '  <dl class="details">',
    '    <div><dt>\u0627\u0644\u0625\u062C\u0627\u0632\u0629 / \u0627\u0644\u0634\u0639\u0628\u0629</dt><dd>' + (item.degree || "\u2014") + '</dd></div>',
    '    <div><dt>\u0627\u0644\u062A\u062E\u0635\u0635</dt><dd>' + (item.specialization || "\u2014") + '</dd></div>',
    '    <div><dt>\u0635\u0641\u062D\u0629 \u0627\u0644\u062F\u0644\u064A\u0644</dt><dd>' + (item.page ?? "\u2014") + '</dd></div>',
    '    <div><dt>\u0627\u0644\u0631\u0645\u0632</dt><dd><code>' + item.code + '</code></dd></div>',
    '    <div><dt>\u0635\u064A\u063A\u0629 \u0627\u062D\u062A\u0633\u0627\u0628 \u0627\u0644\u0645\u062C\u0645\u0648\u0639</dt><dd><code>' + (item.score_formula || "\u2014") + '</code></dd></div>',
    '  </dl>',
    '</article>',
  ].join("\n");
}

function render() {
  const filters = getFilters();
  const filtered = data.filter((item) => matchesFilters(item, filters));

  if (filters.sortOrder) {
    const dir = filters.sortOrder === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const aScore = a.last_guided_total_2025;
      const bScore = b.last_guided_total_2025;
      if (aScore == null && bScore == null) return 0;
      if (aScore == null) return 1;
      if (bScore == null) return -1;
      return (aScore - bScore) * dir;
    });
  }

  els.results.innerHTML = filtered.map(renderCard).join("");
  els.resultsCount.textContent = "\u0639\u0631\u0636 " + filtered.length + " \u0645\u0646 " + data.length + " \u062E\u064A\u0627\u0631";
  els.emptyState.hidden = filtered.length > 0;
  els.results.hidden = filtered.length === 0;
}

function resetFilters() {
  els.categoryFilter.value = "";
  els.scoreMode.value = "";
  els.scoreValue.value = "";
  els.sortOrder.value = "";
  els.searchInput.value = "";
  render();
}

function bindEvents() {
  els.filterBtn.addEventListener("click", render);
  els.resetBtn.addEventListener("click", resetFilters);
}
