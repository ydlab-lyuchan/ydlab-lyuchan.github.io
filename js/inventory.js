(function () {
  const state = {
    items: [],
    q: "",
    category: "all",
  };

  const els = {
    grid: document.getElementById("inv-grid"),
    count: document.getElementById("inv-count"),
    updated: document.getElementById("inv-updated"),
    search: document.getElementById("inv-search"),
    chips: document.getElementById("inv-chips"),
  };

  function statusClass(s) {
    if (s === "在庫") return "badge-in";
    if (s === "出租中") return "badge-out";
    return "badge-limited";
  }

  function categoriesFrom(items) {
    const set = new Set(items.map((i) => i.category));
    return ["all", ...Array.from(set).sort()];
  }

  function renderChips(cats) {
    if (!els.chips) return;
    els.chips.innerHTML = "";
    cats.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = c === "all" ? "全部" : c;
      b.setAttribute("aria-pressed", c === state.category ? "true" : "false");
      b.addEventListener("click", () => {
        state.category = c;
        [...els.chips.querySelectorAll(".chip")].forEach((x) =>
          x.setAttribute("aria-pressed", x === b ? "true" : "false"),
        );
        renderCards();
      });
      els.chips.appendChild(b);
    });
  }

  function filterItems() {
    const q = state.q.trim().toLowerCase();
    return state.items.filter((i) => {
      const catOk = state.category === "all" || i.category === state.category;
      if (!catOk) return false;
      if (!q) return true;
      const blob = [
        i.name,
        i.summary,
        i.category,
        i.note,
        i.id,
        String(i.qty),
        i.status,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }

  function renderCards() {
    const rows = filterItems();
    if (els.count) els.count.textContent = String(rows.length);
    if (!els.grid) return;
    els.grid.innerHTML = "";

    if (!rows.length) {
      els.grid.innerHTML =
        '<div class="empty-state">沒有符合條件的項目，試試其他關鍵字或分類。</div>';
      return;
    }

    for (const i of rows) {
      const card = document.createElement("article");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-image-wrap">
          <img class="product-image" src="${escapeHtml(i.image || "assets/equipment/network.svg")}" alt="${escapeHtml(i.name)}" loading="lazy" />
        </div>
        <div class="product-body">
          <p class="product-category">${escapeHtml(i.category)}</p>
          <h3 class="product-name">${escapeHtml(i.name)}</h3>
          <p class="product-summary">${escapeHtml(i.summary || i.note || "")}</p>
        </div>
      `;
      els.grid.appendChild(card);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  async function load() {
    const res = await fetch("data/equipment.json", { cache: "no-store" });
    if (!res.ok) throw new Error("無法載入器材資料");
    const data = await res.json();
    state.items = data.items || [];
    if (els.updated && data.updated) {
      els.updated.textContent = `資料更新：${data.updated}`;
    }
    renderChips(categoriesFrom(state.items));
    renderCards();
  }

  if (els.search) {
    els.search.addEventListener("input", () => {
      state.q = els.search.value;
      renderCards();
    });
  }

  load().catch(() => {
    if (els.grid) {
      els.grid.innerHTML =
        '<div class="empty-state">載入失敗，請重新整理頁面。</div>';
    }
  });
})();
