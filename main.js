import data from "./data/orientations.json";

const els = {
  stats: document.getElementById("stats"),
  categoryFilter: document.getElementById("categoryFilter"),
  scoreMode: document.getElementById("scoreMode"),
  scoreValue: document.getElementById("scoreValue"),
  sortOrder: document.getElementById("sortOrder"),
  searchInput: document.getElementById("searchInput"),
  resetBtn: document.getElementById("resetBtn"),
  results: document.getElementById("results"),
  resultsCount: document.getElementById("resultsCount"),
  emptyState: document.getElementById("emptyState"),
};

const categories = [...new Set(data.map((d) => d.category))].sort();

function initFilters() {
  for (const cat of categories) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    els.categoryFilter.appendChild(opt);
  }

  const withScore = data.filter((d) => d.last_guided_total_2025 != null);
  const scores = withScore.map((d) => d.last_guided_total_2025);
  const min = Math.min(...scores).toFixed(2);
  const max = Math.max(...scores).toFixed(2);

  els.stats.innerHTML = `
    <div class="stat"><strong>${data.length}</strong><span>خيار</span></div>
    <div class="stat"><strong>${categories.length}</strong><span>قطاع</span></div>
    <div class="stat"><strong>${min} – ${max}</strong><span>نطاق المجاميع</span></div>
  `;
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
      : item.last_guided_display || "—";

  const scoreClass =
    item.last_guided_total_2025 == null
      ? "score score-muted"
      : item.last_guided_total_2025 >= 110
        ? "score score-high"
        : item.last_guided_total_2025 >= 95
          ? "score score-mid"
          : "score";

  return `
    <article class="card orientation-card">
      <div class="card-top">
        <span class="badge">${item.category}</span>
        <span class="${scoreClass}" title="مجموع آخر موجه 2024">${score}</span>
      </div>
      <h3 class="institution">${item.institution || "—"}</h3>
      <dl class="details">
        <div>
          <dt>الإجازة / الشعبة</dt>
          <dd>${item.degree || "—"}</dd>
        </div>
        <div>
          <dt>التخصص</dt>
          <dd>${item.specialization || "—"}</dd>
        </div>
        <div>
          <dt>صفحة الدليل</dt>
          <dd>${item.page ?? "—"}</dd>
        </div>
        <div>
          <dt>الرمز</dt>
          <dd><code>${item.code}</code></dd>
        </div>
        <div>
          <dt>صيغة احتساب المجموع</dt>
          <dd><code>${item.score_formula || "—"}</code></dd>
        </div>
      </dl>
    </article>
  `;
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
  els.resultsCount.textContent = `عرض ${filtered.length} من ${data.length} خيار`;
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

initFilters();
render();

for (const el of [
  els.categoryFilter,
  els.scoreMode,
  els.scoreValue,
  els.sortOrder,
  els.searchInput,
]) {
  el.addEventListener("input", render);
  el.addEventListener("change", render);
}

els.resetBtn.addEventListener("click", resetFilters);
