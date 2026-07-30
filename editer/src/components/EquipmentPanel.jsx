import { useCallback, useEffect, useState } from "react";
import ItemList from "./ItemList.jsx";
import ImagePicker from "./ImagePicker.jsx";
import { emptyEquipment, EQUIPMENT_CATEGORIES, todayISO } from "../lib/types.js";
import {
  normalizeEquipmentPayload,
  validateEquipment,
} from "../lib/validators.js";

function moveItem(items, from, to) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export default function EquipmentPanel({ onStatus }) {
  const [data, setData] = useState({ updated: todayISO(), items: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [paths, setPaths] = useState(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    const [payload, p] = await Promise.all([
      window.ydlabEditor.readData("equipment"),
      window.ydlabEditor.getPaths(),
    ]);
    setData(payload);
    setPaths(p);
    setSelectedIndex(0);
    setDirty(false);
    onStatus(`已載入器材 · ${payload.updated}`);
  }, [onStatus]);

  useEffect(() => {
    load().catch((err) => onStatus(`載入失敗：${err.message}`, true));
  }, [load, onStatus]);

  const item = data.items[selectedIndex] || emptyEquipment();

  function patchItem(patch) {
    setData((prev) => {
      const items = [...prev.items];
      items[selectedIndex] = { ...items[selectedIndex], ...patch };
      return { ...prev, items };
    });
    setDirty(true);
  }

  function handleAdd() {
    setData((prev) => {
      const items = [...prev.items, emptyEquipment()];
      setSelectedIndex(items.length - 1);
      return { ...prev, items };
    });
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
    const payload = normalizeEquipmentPayload({
      ...data,
      updated: todayISO(),
    });
    const errors = validateEquipment(payload);
    if (errors.length) {
      onStatus(errors.join("；"), true);
      return;
    }
    await window.ydlabEditor.saveData("equipment", payload);
    setData(payload);
    setDirty(false);
    onStatus(`已儲存 → data/equipment.json (${payload.updated})`);
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
        renderLabel={(row) => row.name || "(未命名)"}
      />

      <section className="panel-form">
        <header className="form-header">
          <h2>編輯器材</h2>
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

        <div className="field">
          <label htmlFor="eq-name">名稱 *</label>
          <input
            id="eq-name"
            value={item.name}
            onChange={(e) => patchItem({ name: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="eq-category">分類 *（多個用、分隔）</label>
          <input
            id="eq-category"
            list="eq-categories"
            value={item.category}
            onChange={(e) => patchItem({ category: e.target.value })}
            placeholder="例：音響、視訊"
          />
          <datalist id="eq-categories">
            {EQUIPMENT_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="field">
          <label htmlFor="eq-summary">摘要</label>
          <textarea
            id="eq-summary"
            rows={4}
            value={item.summary}
            onChange={(e) => patchItem({ summary: e.target.value })}
          />
        </div>

        <ImagePicker
          label="圖片"
          target="equipment"
          value={item.image}
          onChange={(image) => patchItem({ image })}
        />

        {paths ? (
          <p className="hint">寫入：{paths.equipmentJson}</p>
        ) : null}
      </section>
    </div>
  );
}
