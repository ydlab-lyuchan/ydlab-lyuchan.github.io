# 曜動科技 · 內容編輯器

```
editer/
  package.json
  vite.config.js
  index.html
  desktop/
    main.cjs
    preload.cjs
  src/
```

選圖會自動複製到 `assets/` 或 `assets/cases/`，儲存後請自行 `git commit` + `push`。

> 重要：必須用 `npm run dev` 彈出的 **Electron 桌面視窗**，不要用瀏覽器開 `localhost:5173`。

## 需求

- Node.js **16+**（已降級 Vite 4 相容舊版）
- 建議 Node 20/22：`cd editer && nvm use`

若曾裝過舊依賴，請先 `rm -rf node_modules package-lock.json && npm install`

## 安裝

```bash
cd editer
npm install
```

## 開發 / 使用

```bash
npm run dev
```

會同時啟動 Vite dev server 與 Electron 視窗。

## 生產模式（可選）

```bash
npm start
```

先 build renderer 再以 Electron 載入 `dist/`。

## 操作

1. 頂部切換 **在庫器材** / **實際案例**
2. 左側列表選項目，右側編輯表單
3. **選擇圖片** 會複製檔案並填入相對路徑
4. 按 **儲存** 寫入 JSON（`updated` 自動更新為今天）
5. 到 repo root 確認 diff 後 push

## 案例欄位備註

- `description`：空行 `\n\n` 分段（對應官網段落）
- `youtube`：可填 watch URL、youtu.be 或純 video ID
- `images`：多圖 gallery，封面用 `image`
- `homeLimit`：首頁最新案例筆數
