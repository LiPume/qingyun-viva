import { Database, Download, RefreshCcw, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useDataset } from "../features/dataset/DatasetContext";
import { useAppState } from "../features/training/AppStateContext";

export function SettingsPage() {
  const { dataset, reload } = useDataset();
  const { progress, history, settings, updateSettings, exportBackup, importBackup, clearTrainingHistory } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const downloadBackup = () => {
    const payload = exportBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qingyun-viva-backup-${payload.exportedAt.slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("已导出完整本地备份。");
  };
  const uploadBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      importBackup(JSON.parse(await file.text()) as unknown);
      setMessage(`已从 ${file.name} 恢复进度、历史与设置。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "备份导入失败。");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="page settings-page">
      <header className="page-header"><div><p className="eyebrow">Local-first controls</p><h1>设置与数据</h1><p>所有练习记录只保存在当前浏览器，不上传服务器。</p></div><ShieldCheck size={42} aria-hidden="true" /></header>
      {message && <div className="status-message" role="status">{message}</div>}
      <section className="settings-section"><div className="settings-title"><span><Database size={20} /></span><div><h2>研习偏好</h2><p>控制 Dashboard 的日目标和默认计时。</p></div></div><div className="settings-fields"><label>每日目标题数<input name="daily-goal" inputMode="numeric" type="number" min="1" max="30" value={settings.dailyGoal} onChange={(event) => updateSettings({ dailyGoal: Math.min(30, Math.max(1, Number(event.target.value))) })} /></label><label>默认口述时长<select name="default-timer" value={settings.timerSeconds} onChange={(event) => updateSettings({ timerSeconds: Number(event.target.value) as 45 | 60 | 90 })}><option value="45">45 秒</option><option value="60">60 秒</option><option value="90">90 秒</option></select></label></div></section>
      <section className="settings-section"><div className="settings-title"><span><Download size={20} /></span><div><h2>备份与恢复</h2><p>备份包含训练进度、练习历史和偏好，带 `schemaVersion: 1`。</p></div></div><div className="settings-actions"><button className="button primary" onClick={downloadBackup}><Download size={18} />导出完整备份</button><button className="button secondary" onClick={() => inputRef.current?.click()}><Upload size={18} />导入备份</button><input ref={inputRef} className="sr-only" type="file" accept="application/json,.json" onChange={uploadBackup} aria-label="选择青云问道备份 JSON" /></div></section>
      <section className="settings-section"><div className="settings-title"><span><RefreshCcw size={20} /></span><div><h2>默认题库</h2><p>重新从内置 JSON 加载并校验 246 道题，不会覆盖你的练习进度。</p></div></div><div className="dataset-facts"><span><strong>{dataset?.questions.length ?? 0}</strong>题</span><span><strong>{dataset?.schools.length ?? 0}</strong>校</span><span><strong>{Object.keys(progress).length}</strong>题有本地状态</span></div><button className="button secondary" onClick={() => { reload(); setMessage("已重新加载默认题库，本地训练历史未改动。"); }}><RefreshCcw size={18} />重置默认题库，保留进度</button></section>
      <section className="settings-section danger-zone"><div className="settings-title"><span><Trash2 size={20} /></span><div><h2>清空训练历史</h2><p>将删除 {history.length} 条练习记录与全部掌握度/收藏，默认题库不受影响。</p></div></div><button className="button danger" onClick={() => { if (window.confirm("确定清空全部训练历史吗？此操作不可撤销。")) { clearTrainingHistory(); setMessage("训练历史已清空。"); } }}><Trash2 size={18} />清空训练历史</button></section>
    </div>
  );
}
