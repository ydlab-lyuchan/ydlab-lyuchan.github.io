import { useCallback, useState } from "react";
import Tabs from "./components/Tabs.jsx";
import EquipmentPanel from "./components/EquipmentPanel.jsx";
import CasesPanel from "./components/CasesPanel.jsx";

const TABS = [
  { id: "equipment", label: "在庫器材" },
  { id: "cases", label: "實際案例" },
];

const hasEditorApi = typeof window !== "undefined" && !!window.ydlabEditor;

export default function App() {
  const [tab, setTab] = useState("equipment");
  const [status, setStatus] = useState({
    message: hasEditorApi ? "就緒" : "未偵測到 Electron API",
    error: !hasEditorApi,
  });

  const onStatus = useCallback((message, error = false) => {
    setStatus({ message, error });
  }, []);

  if (!hasEditorApi) {
    return (
      <div className="app">
        <main className="boot-error">
          <h1>請用 Electron 視窗開啟</h1>
          <p>
            你現在是在瀏覽器開 Vite（沒有檔案 API）。關掉這個分頁，在
            terminal 跑：
          </p>
          <pre>cd editer && nvm use 22 && npm run dev</pre>
          <p>然後用彈出的桌面視窗操作，不要開 localhost:5173。</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="tagline">YDLAB Editor</p>
          <h1>內容編輯器</h1>
        </div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </header>

      <main className="app-main">
        {tab === "equipment" ? (
          <EquipmentPanel onStatus={onStatus} />
        ) : (
          <CasesPanel onStatus={onStatus} />
        )}
      </main>

      <footer className={`status-bar ${status.error ? "error" : ""}`}>
        {status.message}
      </footer>
    </div>
  );
}
