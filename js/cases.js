(function () {
  const HOME_DEFAULT_LIMIT = 3;

  const els = {
    list: document.getElementById("cases-list"),
    home: document.getElementById("home-cases"),
    detail: document.getElementById("case-detail"),
    count: document.getElementById("cases-count"),
    updated: document.getElementById("cases-updated"),
    search: document.getElementById("cases-search"),
    chips: document.getElementById("cases-chips"),
  };

  const state = {
    items: [],
    q: "",
    category: "all",
    homeLimit: HOME_DEFAULT_LIMIT,
  };

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function assetUrl(path) {
    if (!path) return "";
    return String(path)
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
  }

  function formatDate(date) {
    if (!date) return "";
    const d = String(date);
    return d.length >= 10 ? d.slice(0, 10) : d;
  }

  function youtubeEmbedUrl(raw) {
    if (!raw) return "";
    const s = String(raw).trim();
    if (!s) return "";
    if (/youtube\.com\/embed\//i.test(s)) {
      const m = s.match(/embed\/([A-Za-z0-9_-]{6,})/);
      return m ? `https://www.youtube.com/embed/${m[1]}` : s;
    }
    const m = s.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*?v=|shorts\/|embed\/)|v=)([A-Za-z0-9_-]{6,})/i,
    );
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    if (/^[A-Za-z0-9_-]{6,}$/.test(s)) return `https://www.youtube.com/embed/${s}`;
    return "";
  }

  function sortByDateDesc(items) {
    return [...items].sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || "")),
    );
  }

  function splitCategories(raw) {
    return String(raw || "")
      .split("、")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  function categoriesFrom(items) {
    const set = new Set();
    for (const i of items) {
      for (const c of splitCategories(i.category)) set.add(c);
    }
    return ["all", ...Array.from(set).sort()];
  }

  function detailIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return (params.get("id") || "").trim();
  }

  function detailHref(item) {
    return `case.html?id=${encodeURIComponent(item.id || "")}`;
  }

  function descriptionHtml(text) {
    const parts = String(text || "")
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return "";
    return parts
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
      .join("");
  }

  function galleryHtml(item) {
    const images = Array.isArray(item.images) && item.images.length
      ? item.images
      : item.image
        ? [item.image]
        : [];
    if (!images.length) return "";
    if (images.length === 1) {
      return `
        <div class="case-cover">
          <button type="button" class="case-zoom-btn" data-lightbox-index="0" aria-label="放大圖片">
            <img src="${assetUrl(images[0])}" alt="${escapeHtml(item.title)}" loading="lazy" />
          </button>
        </div>`;
    }
    return `
      <div class="case-gallery">
        ${images
          .map(
            (src, idx) => `
          <figure class="case-gallery-item">
            <button type="button" class="case-zoom-btn" data-lightbox-index="${idx}" aria-label="放大圖片 ${idx + 1}">
              <img src="${assetUrl(src)}" alt="${escapeHtml(item.title)} - ${idx + 1}" loading="lazy" />
            </button>
          </figure>`,
          )
          .join("")}
      </div>`;
  }

  function itemImages(item) {
    if (Array.isArray(item.images) && item.images.length) return item.images;
    if (item.image) return [item.image];
    return [];
  }

  const lightbox = {
    el: null,
    img: null,
    counter: null,
    srcs: [],
    index: 0,
  };

  function ensureLightbox() {
    if (lightbox.el) return;
    const el = document.createElement("div");
    el.id = "case-lightbox";
    el.className = "lightbox";
    el.hidden = true;
    el.innerHTML = `
      <div class="lightbox-backdrop" data-lightbox-close></div>
      <button type="button" class="lightbox-close" data-lightbox-close aria-label="關閉">✕</button>
      <button type="button" class="lightbox-nav lightbox-prev" data-lightbox-prev aria-label="上一張">‹</button>
      <figure class="lightbox-figure">
        <img class="lightbox-img" alt="" />
        <figcaption class="lightbox-counter"></figcaption>
      </figure>
      <button type="button" class="lightbox-nav lightbox-next" data-lightbox-next aria-label="下一張">›</button>
    `;
    document.body.appendChild(el);
    lightbox.el = el;
    lightbox.img = el.querySelector(".lightbox-img");
    lightbox.counter = el.querySelector(".lightbox-counter");

    el.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest("[data-lightbox-close]")) closeLightbox();
      else if (t.closest("[data-lightbox-prev]")) showLightbox(lightbox.index - 1);
      else if (t.closest("[data-lightbox-next]")) showLightbox(lightbox.index + 1);
    });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.el || lightbox.el.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showLightbox(lightbox.index - 1);
      else if (e.key === "ArrowRight") showLightbox(lightbox.index + 1);
    });
  }

  function showLightbox(index) {
    if (!lightbox.srcs.length) return;
    const n = lightbox.srcs.length;
    lightbox.index = ((index % n) + n) % n;
    lightbox.img.src = assetUrl(lightbox.srcs[lightbox.index]);
    lightbox.counter.textContent =
      n > 1 ? `${lightbox.index + 1} / ${n}` : "";
    const showNav = n > 1;
    lightbox.el.querySelector(".lightbox-prev").hidden = !showNav;
    lightbox.el.querySelector(".lightbox-next").hidden = !showNav;
  }

  function openLightbox(srcs, index) {
    ensureLightbox();
    lightbox.srcs = srcs.filter(Boolean);
    if (!lightbox.srcs.length) return;
    showLightbox(index || 0);
    lightbox.el.hidden = false;
    document.body.classList.add("lightbox-open");
  }

  function closeLightbox() {
    if (!lightbox.el) return;
    lightbox.el.hidden = true;
    lightbox.img.removeAttribute("src");
    document.body.classList.remove("lightbox-open");
  }

  function bindDetailLightbox(item) {
    const srcs = itemImages(item);
    els.detail.querySelectorAll("[data-lightbox-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-lightbox-index")) || 0;
        openLightbox(srcs, idx);
      });
    });
  }

  function videoHtml(item) {
    const src = youtubeEmbedUrl(item.youtube);
    if (!src) return "";
    return `
      <div class="video-embed">
        <iframe
          src="${escapeHtml(src)}"
          title="${escapeHtml(item.title)} 影片"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      </div>`;
  }

  function teaserCard(item) {
    const card = document.createElement("a");
    card.className = "case-teaser";
    card.href = detailHref(item);
    card.innerHTML = `
      <div class="case-teaser-image">
        <img src="${assetUrl(item.image || "assets/null.png")}" alt="${escapeHtml(item.title)}" loading="lazy" />
      </div>
      <div class="case-teaser-body">
        <p class="case-meta">
          <span>${escapeHtml(formatDate(item.date))}</span>
          ${item.category ? `<span class="case-cat">${escapeHtml(item.category)}</span>` : ""}
        </p>
        <h3 class="case-teaser-title">${escapeHtml(item.title)}</h3>
        <p class="case-teaser-summary">${escapeHtml(item.summary || "")}</p>
      </div>
    `;
    return card;
  }

  function filterItems() {
    const q = state.q.trim().toLowerCase();
    return state.items.filter((i) => {
      const catOk =
        state.category === "all" ||
        splitCategories(i.category).includes(state.category);
      if (!catOk) return false;
      if (!q) return true;
      const blob = [i.title, i.summary, i.description, i.category, i.id, i.date]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
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
        renderList();
      });
      els.chips.appendChild(b);
    });
  }

  function renderList() {
    if (!els.list) return;
    const rows = filterItems();
    if (els.count) els.count.textContent = String(rows.length);
    els.list.innerHTML = "";

    if (!rows.length) {
      els.list.innerHTML =
        '<div class="empty-state">沒有符合條件的案例，試試其他關鍵字或分類。</div>';
      return;
    }

    for (const item of rows) {
      els.list.appendChild(teaserCard(item));
    }
  }

  function renderHome() {
    if (!els.home) return;
    const rows = sortByDateDesc(state.items).slice(0, state.homeLimit);
    els.home.innerHTML = "";

    if (!rows.length) {
      els.home.innerHTML = '<div class="empty-state">尚無案例資料。</div>';
      return;
    }

    for (const item of rows) {
      els.home.appendChild(teaserCard(item));
    }
  }

  function renderDetail() {
    if (!els.detail) return;
    const id = detailIdFromQuery();
    if (!id) {
      els.detail.innerHTML =
        '<div class="empty-state">找不到案例。請從<a href="cases.html">案例列表</a>進入。</div>';
      return;
    }

    const item = state.items.find((i) => String(i.id) === id);
    if (!item) {
      els.detail.innerHTML =
        '<div class="empty-state">找不到這個案例。請回到<a href="cases.html">案例列表</a>。</div>';
      return;
    }

    document.title = `${item.title}｜曜動科技`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && item.summary) desc.setAttribute("content", item.summary);

    els.detail.innerHTML = `
      <article class="case-card case-detail">
        ${galleryHtml(item)}
        <div class="case-body">
          <p class="case-meta">
            <span>${escapeHtml(formatDate(item.date))}</span>
            ${item.category ? `<span class="case-cat">${escapeHtml(item.category)}</span>` : ""}
          </p>
          <h1 class="case-title">${escapeHtml(item.title)}</h1>
          ${item.summary ? `<p class="case-summary">${escapeHtml(item.summary)}</p>` : ""}
          <div class="case-description">${descriptionHtml(item.description)}</div>
          ${videoHtml(item)}
        </div>
      </article>
    `;
    bindDetailLightbox(item);
  }

  async function load() {
    const res = await fetch("data/cases.json", { cache: "no-store" });
    if (!res.ok) throw new Error("無法載入案例資料");
    const data = await res.json();
    state.items = sortByDateDesc(data.items || []);
    state.homeLimit = Number(data.homeLimit) > 0 ? Number(data.homeLimit) : HOME_DEFAULT_LIMIT;

    if (els.updated && data.updated) {
      els.updated.textContent = `資料更新：${data.updated}`;
    }

    if (els.list) {
      renderChips(categoriesFrom(state.items));
      renderList();
    }
    renderHome();
    renderDetail();
  }

  if (els.search) {
    els.search.addEventListener("input", () => {
      state.q = els.search.value;
      renderList();
    });
  }

  load().catch(() => {
    const msg = '<div class="empty-state">載入失敗，請重新整理頁面。</div>';
    if (els.list) els.list.innerHTML = msg;
    if (els.home) els.home.innerHTML = msg;
    if (els.detail) els.detail.innerHTML = msg;
  });
})();
