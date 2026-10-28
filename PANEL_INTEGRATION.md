# 官網內容管理

官網保留 GitHub Pages 與原本網域、CSS 及素材。首頁、關於、聯絡資訊、案例與器材內容改由 https://quotation.ydlab.cc/ 的「官網管理」保存與發布。

- 先儲存草稿，確認後發布；僅已發布內容由公開 API 提供。
- 案例與器材讀取失敗時，沿用 data/cases.json 與 data/equipment.json；頁面文字讀取失敗則保留 HTML 原始文字。
- assets/ 原始圖片保留；面板新上傳圖片使用其公開圖片網址。
- 網站腳本不包含帳密或 Token，不使用管理者 Cookie 讀取內容。
- 權限由面板管理員 lyuchan 設定；官網管理者不能因此取得報價、勞報或對話權限。
- 舊 editer 桌面編輯器修改的 JSON 現為備援來源，不會自動覆蓋面板已發布內容。

js/panel-content.js 共用公開內容載入；其原始副本保存在報價系統儲存庫 integrations/website-panel-content.js。更新共用程式時需同步兩邊，實際內容編輯不需要 Git 推送。
