import { useCallback, useEffect, useState } from "react";
import ItemList from "./ItemList.jsx";
import ImagePicker from "./ImagePicker.jsx";
import {
  CASE_CATEGORIES,
  emptyCase,
  suggestCaseId,
  todayISO,
} from "../lib/types.js";
import { normalizeCasesPayload, validateCases } from "../lib/validators.js";

function moveItem(items, from, to) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

function GalleryImages({ images, onChange }) {
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const next = {};
      for (const src of images) {
        next[src] = await window.ydlabEditor.resolveAssetUrl(src);
      }
      if (!cancelled) setPreviews(next);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [images]);

  async function handleAdd() {
    const rel = await window.ydlabEditor.pickImage({ target: "cases" });
    if (rel) onChange([...images, rel]);
  }

  function handleRemove(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  function handleMove(index, dir) {
    const to = index + dir;
    if (to < 0 || to >= images.length) return;
    onChange(moveItem(images, index, to));
  }

  return (
    <div className="field">
      <label>多圖 gallery</label>
      <div className="gallery-toolbar">
        <button type="button" className="btn" onClick={handleAdd}>
          新增圖片
        </button>
      </div>
      <ul className="gallery-list">
        {images.map((src, index) => (
          <li key={`${src}-${index}`}>
            {previews[src] ? (
              <img src={previews[src]} alt="" />
            ) : (
              <div className="gallery-placeholder" />
            )}
            <code>{src}</code>
            <div className="gallery-actions">
              <button type="button" onClick={() => handleMove(index, -1)}>
                ↑
              </button>
              <button type="button" onClick={() => handleMove(index, 1)}>
                ↓
              </button>
              <button type="button" onClick={() => handleRemove(index)}>
                刪
              </button>
            </div>
          </li>
        ))}
        {!images.length ? <li className="empty">尚無多圖</li> : null}
      </ul>
    </div>
  );
}

export default function CasesPanel({ onStatus }) {
  const [data, setData] = useState({ updated: todayISO(), homeLimit: 3, items: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [paths, setPaths] = useState(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    const [payload, p] = await Promise.all([
      window.ydlabEditor.readData("cases"),
      window.ydlabEditor.getPaths(),
    ]);
    const sorted = {
      ...payload,
      items: [...(payload.items || [])].sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || "")),
      ),
    };
    setData(sorted);
    setPaths(p);
    setSelectedIndex(0);
    setDirty(false);
    onStatus(`已載入案例 · ${sorted.updated}`);
  }, [onStatus]);

  useEffect(() => {
    load().catch((err) => onStatus(`載入失敗：${err.message}`, true));
  }, [load, onStatus]);

  const item = data.items[selectedIndex] || emptyCase();

  function patchItem(patch) {
    setData((prev) => {
      const items = [...prev.items];
      items[selectedIndex] = { ...items[selectedIndex], ...patch };
      return { ...prev, items };
    });
    setDirty(true);
  }

  function handleAdd() {
    const row = emptyCase();
    row.id = suggestCaseId("new-case", row.date);
    setData((prev) => ({
      ...prev,
      items: [row, ...prev.items],
    }));
    setSelectedIndex(0);
    setDirty(true);
  }

  function handleDelete(index) {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setSelectedIndex((i) => Math.max(0, Math.min(i, data.items.length - 2)));
    setDirty(true);
  }

  async function handleSave() {
    const payload = normalizeCasesPayload({
      ...data,
      updated: todayISO(),
    });
    const errors = validateCases(payload);
    if (errors.length) {
      onStatus(errors.join("；"), true);
      return;
    }
    await window.ydlabEditor.saveData("cases", payload);
    setData(payload);
    setDirty(false);
    onStatus(`已儲存 → data/cases.json (${payload.updated})`);
  }

  return (
    <div className="editor-panel">
      <ItemList
        items={data.items}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onMoveUp={(i) => {
          setData((prev) => ({ ...prev, items: moveItem(prev.items, i, i - 1) }));
          setSelectedIndex((idx) => (idx === i ? i - 1 : idx));
          setDirty(true);
        }}
        onMoveDown={(i) => {
          setData((prev) => ({ ...prev, items: moveItem(prev.items, i, i + 1) }));
          setSelectedIndex((idx) => (idx === i ? i + 1 : idx));
          setDirty(true);
        }}
        onDelete={handleDelete}
        onAdd={handleAdd}
        query={query}
        onQueryChange={setQuery}
        renderLabel={(row) => `${row.date || "----"} · ${row.title || "(未命名)"}`}
      />

      <section className="panel-form">
        <header className="form-header">
          <h2>編輯案例</h2>
          <div className="form-actions">
            <button type="button" className="btn" onClick={load}>
              重新載入
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!dirty}
            >
              儲存
            </button>
          </div>
        </header>

        <div className="field-row">
          <div className="field">
            <label htmlFor="cs-homelimit">首頁顯示筆數</label>
            <input
              id="cs-homelimit"
              type="number"
              min={1}
              value={data.homeLimit ?? 3}
              onChange={(e) => {
                setData((prev) => ({ ...prev, homeLimit: Number(e.target.value) }));
                setDirty(true);
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="cs-id">ID *</label>
            <div className="inline-row">
              <input
                id="cs-id"
                value={item.id}
                onChange={(e) => patchItem({ id: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => patchItem({ id: suggestCaseId(item.title, item.date) })}
              >
                自動產生
              </button>
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="cs-title">標題 *</label>
          <input
            id="cs-title"
            value={item.title}
            onChange={(e) => patchItem({ title: e.target.value })}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="cs-date">日期 *</label>
            <input
              id="cs-date"
              type="date"
              value={item.date?.slice(0, 10) || ""}
              onChange={(e) => patchItem({ date: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="cs-category">分類（多個用、分隔）</label>
            <input
              id="cs-category"
              list="cs-categories"
              value={item.category}
              onChange={(e) => patchItem({ category: e.target.value })}
              placeholder="例：視訊、音響"
            />
            <datalist id="cs-categories">
              {CASE_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="field">
          <label htmlFor="cs-summary">摘要</label>
          <textarea
            id="cs-summary"
            rows={2}
            value={item.summary}
            onChange={(e) => patchItem({ summary: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="cs-description">完整介紹</label>
          <textarea
            id="cs-description"
            rows={8}
            value={item.description}
            onChange={(e) => patchItem({ description: e.target.value })}
            placeholder="空行分段（對應官網段落）"
          />
        </div>

        <ImagePicker
          label="封面圖"
          target="cases"
          value={item.image}
          onChange={(image) => patchItem({ image })}
        />

        <GalleryImages
          images={item.images || []}
          onChange={(images) => patchItem({ images })}
        />

        <div className="field">
          <label htmlFor="cs-youtube">YouTube（URL 或 ID，可留空）</label>
          <input
            id="cs-youtube"
            value={item.youtube || ""}
            onChange={(e) => patchItem({ youtube: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        {paths ? <p className="hint">寫入：{paths.casesJson}</p> : null}
      </section>
    </div>
  );
}
