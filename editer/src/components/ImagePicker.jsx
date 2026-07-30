import { useEffect, useState } from "react";

export default function ImagePicker({ value, target, onChange, label = "圖片" }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!value) {
        setPreview(null);
        return;
      }
      const url = await window.ydlabEditor.resolveAssetUrl(value);
      if (!cancelled) setPreview(url);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [value]);

  async function handlePick() {
    const rel = await window.ydlabEditor.pickImage({ target });
    if (rel) onChange(rel);
  }

  return (
    <div className="field image-picker">
      <label>{label}</label>
      <div className="image-picker-row">
        <input type="text" value={value || ""} readOnly placeholder="尚未選擇圖片" />
        <button type="button" className="btn" onClick={handlePick}>
          選擇圖片
        </button>
        {value ? (
          <button type="button" className="btn btn-ghost" onClick={() => onChange("")}>
            清除
          </button>
        ) : null}
      </div>
      {preview ? (
        <img className="image-preview" src={preview} alt="" />
      ) : (
        <div className="image-preview placeholder">無預覽</div>
      )}
    </div>
  );
}
