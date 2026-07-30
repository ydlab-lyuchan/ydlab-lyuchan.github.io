export default function ItemList({
  items,
  selectedIndex,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAdd,
  query,
  onQueryChange,
  renderLabel,
}) {
  const q = query.trim().toLowerCase();
  const filtered = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (!q) return true;
      return renderLabel(item).toLowerCase().includes(q);
    });

  return (
    <aside className="panel-list">
      <div className="panel-list-toolbar">
        <input
          type="search"
          placeholder="搜尋…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          新增
        </button>
      </div>
      <ul className="item-list">
        {filtered.map(({ item, index }) => (
          <li key={index}>
            <button
              type="button"
              className={selectedIndex === index ? "item-btn active" : "item-btn"}
              onClick={() => onSelect(index)}
            >
              {renderLabel(item)}
            </button>
            <div className="item-actions">
              <button type="button" title="上移" onClick={() => onMoveUp(index)}>
                ↑
              </button>
              <button type="button" title="下移" onClick={() => onMoveDown(index)}>
                ↓
              </button>
              <button type="button" title="刪除" onClick={() => onDelete(index)}>
                ✕
              </button>
            </div>
          </li>
        ))}
        {!filtered.length ? <li className="empty">沒有符合的項目</li> : null}
      </ul>
    </aside>
  );
}
