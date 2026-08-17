import { BookOpenText, Check, Database, Download, FileJson, RefreshCcw, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useDataset, type DatasetImportCandidate } from "../features/dataset/DatasetContext";
import { MAX_DATASET_FILE_BYTES } from "../features/dataset/storage";
import { useAppState } from "../features/training/AppStateContext";

function downloadJson(value: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

const today = (): string => new Date().toISOString().slice(0, 10);
const formatImportedAt = (value?: string): string => value
  ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(value))
  : "刚刚";

export function SettingsPage() {
  const { dataset, origin, warning, prepareImport, activateImport, resetToDefault } = useDataset();
  const {
    progress,
    history,
    settings,
    updateSettings,
    exportBackup,
    importBackup,
    recalculateReviewSchedule,
    clearTrainingHistory,
  } = useAppState();
  const backupInputRef = useRef<HTMLInputElement>(null);
  const datasetInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [candidate, setCandidate] = useState<DatasetImportCandidate | null>(null);
  const [recalculateExisting, setRecalculateExisting] = useState(true);

  const downloadLearningArchive = () => {
    const payload = exportBackup();
    downloadJson(payload, `qingyun-viva-learning-${payload.exportedAt.slice(0, 10)}.json`);
    setMessage("已导出学习档案；文件不包含题库内容。");
  };

  const uploadLearningArchive = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      importBackup(JSON.parse(await file.text()) as unknown);
      setMessage(`已从 ${file.name} 恢复掌握度、历史与设置。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "学习档案导入失败。");
    } finally {
      event.target.value = "";
    }
  };

  const downloadDefaultDataset = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/default-dataset.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      downloadJson(await response.json() as unknown, "qingyun-viva-dataset-default.json");
      setMessage("已下载完整内置题库模板，可编辑后重新导入。");
    } catch (error) {
      setMessage(`内置题库下载失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const downloadCurrentDataset = () => {
    if (!dataset) return;
    downloadJson(dataset, `qingyun-viva-dataset-current-${today()}.json`);
    setMessage(`已导出当前题库：${dataset.questions.length} 题、${dataset.schools.length} 校。`);
  };

  const inspectDataset = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_DATASET_FILE_BYTES) throw new Error("题库文件不能超过 4 MB。");
      const next = prepareImport(JSON.parse(await file.text()) as unknown, file.name);
      setCandidate(next);
      setRecalculateExisting(true);
      setMessage(`已校验 ${file.name}，请核对变化后确认启用。`);
    } catch (error) {
      setCandidate(null);
      setMessage(`题库未导入：${error instanceof Error ? error.message : "文件无法解析"}`);
    } finally {
      event.target.value = "";
    }
  };

  const confirmDataset = () => {
    if (!candidate) return;
    try {
      activateImport(candidate);
      if (recalculateExisting) recalculateReviewSchedule(candidate.dataset.reviewPolicy);
      setMessage(`已启用 ${candidate.fileName}：${candidate.dataset.questions.length} 题、${candidate.dataset.schools.length} 校。${recalculateExisting ? "已有下次复习日期已按新周期重算。" : "已有复习日期保持不变。"}`);
      setCandidate(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "题库未能保存，原题库仍然有效。");
    }
  };

  if (!dataset) return null;
  const policy = dataset.reviewPolicy;
  const nextPolicy = candidate?.dataset.reviewPolicy;
  const questionDelta = candidate ? candidate.dataset.questions.length - dataset.questions.length : 0;
  const schoolDelta = candidate ? candidate.dataset.schools.length - dataset.schools.length : 0;
  const subjectDelta = candidate ? candidate.dataset.subjects.length - dataset.subjects.length : 0;
  const activeQuestionIds = new Set(dataset.questions.map((question) => question.id));
  const archivedProgress = Object.keys(progress).filter((id) => !activeQuestionIds.has(id)).length;

  return (
    <div className="page settings-page">
      <header className="page-header"><div><p className="eyebrow">Local-first controls</p><h1>设置与数据</h1><p>题库内容与个人学习档案分别管理，都只保存在当前浏览器。</p></div><ShieldCheck size={42} aria-hidden="true" /></header>
      {message && <div className="status-message" role="status">{message}</div>}

      <section className="settings-section">
        <div className="settings-title"><span><Database size={20} aria-hidden="true" /></span><div><h2>研习偏好</h2><p>控制 Dashboard 的日目标和默认计时。</p></div></div>
        <div className="settings-fields"><label>每日目标题数<input name="daily-goal" autoComplete="off" inputMode="numeric" type="number" min="1" max="30" value={settings.dailyGoal} onChange={(event) => updateSettings({ dailyGoal: Math.min(30, Math.max(1, Number(event.target.value))) })} /></label><label>默认口述时长<select name="default-timer" autoComplete="off" value={settings.timerSeconds} onChange={(event) => updateSettings({ timerSeconds: Number(event.target.value) as 45 | 60 | 90 })}><option value="45">45 秒</option><option value="60">60 秒</option><option value="90">90 秒</option></select></label></div>
      </section>

      <section className="settings-section dataset-settings">
        <div className="settings-title"><span><FileJson size={20} aria-hidden="true" /></span><div><h2>题库内容</h2><p>下载完整 JSON，编辑院校、题目或复习周期，再校验导入。</p></div></div>
        <div className="dataset-manager">
          <div className="dataset-source"><span className={`source-seal ${origin.kind}`}>{origin.kind === "default" ? "内置" : "自定"}</span><div><strong>{dataset.metadata.name}</strong><small>{origin.kind === "custom" ? `${origin.fileName} · ${formatImportedAt(origin.importedAt)}` : "随网站发布的默认题库"}</small></div></div>
          <div className="dataset-facts" aria-label="当前题库概况"><span><strong>{dataset.questions.length}</strong>题</span><span><strong>{dataset.schools.length}</strong>校</span><span><strong>{dataset.subjects.length}</strong>科</span><span><strong>{policy.redDays}/{policy.yellowDays}/{policy.greenDays}/{policy.greenStreak2Days}</strong>天周期</span></div>
          <div className="settings-actions dataset-actions">
            <button className="button secondary" onClick={() => void downloadDefaultDataset()}><Download size={18} aria-hidden="true" />下载内置模板</button>
            <button className="button secondary" onClick={downloadCurrentDataset}><Download size={18} aria-hidden="true" />导出当前题库</button>
            <button className="button primary" onClick={() => datasetInputRef.current?.click()}><Upload size={18} aria-hidden="true" />导入自定义题库</button>
            <input ref={datasetInputRef} name="dataset-file" className="sr-only" type="file" accept="application/json,.json" onChange={inspectDataset} aria-label="选择青云问道题库 JSON" />
          </div>
          <a className="dataset-guide-link" href="https://github.com/LiPume/qingyun-viva/blob/main/docs/DATASET_EDITING.md" target="_blank" rel="noreferrer"><BookOpenText size={16} aria-hidden="true" />查看新增院校、题目和复习周期示例</a>
          {candidate && nextPolicy && (
            <div className="import-preview" role="region" aria-labelledby="dataset-preview-title">
              <header><div><span id="dataset-preview-title">待启用题库</span><strong>{candidate.fileName}</strong></div><FileJson size={24} aria-hidden="true" /></header>
              <div className="preview-changes">
                <span><strong>{candidate.dataset.questions.length}</strong>题 <i>{questionDelta >= 0 ? `+${questionDelta}` : questionDelta}</i></span>
                <span><strong>{candidate.dataset.schools.length}</strong>校 <i>{schoolDelta >= 0 ? `+${schoolDelta}` : schoolDelta}</i></span>
                <span><strong>{candidate.dataset.subjects.length}</strong>科 <i>{subjectDelta >= 0 ? `+${subjectDelta}` : subjectDelta}</i></span>
              </div>
              <p className="policy-change"><span>新复习周期</span>红 {nextPolicy.redDays} 天 · 黄 {nextPolicy.yellowDays} 天 · 绿 {nextPolicy.greenDays} 天 · 连续绿/熟练 {nextPolicy.greenStreak2Days} 天</p>
              <label className="recalculate-option"><input name="recalculate-review-dates" type="checkbox" checked={recalculateExisting} onChange={(event) => setRecalculateExisting(event.target.checked)} /><span><strong>按新周期重算已有下次复习日期</strong><small>保留掌握度和历史，只调整 `nextReviewAt`。</small></span></label>
              <div className="preview-actions"><button className="button primary" onClick={confirmDataset}><Check size={18} aria-hidden="true" />确认启用</button><button className="button ghost" onClick={() => { setCandidate(null); setMessage("已取消本次题库导入。"); }}><X size={18} aria-hidden="true" />取消</button></div>
            </div>
          )}
          <div className="dataset-reset"><p>恢复内置题库不会删除学习档案。{archivedProgress > 0 && ` 当前另有 ${archivedProgress} 道题的历史状态被保留但未显示。`}</p><button className="text-button" disabled={origin.kind === "default" && !warning} onClick={() => { resetToDefault(); setCandidate(null); setMessage("正在恢复内置题库；练习历史和收藏保持不变。"); }}><RefreshCcw size={17} aria-hidden="true" />恢复内置题库</button></div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-title"><span><Download size={20} aria-hidden="true" /></span><div><h2>学习档案</h2><p>仅包含掌握度、收藏、练习历史和偏好，不包含题目、答案或院校。</p></div></div>
        <div><div className="archive-facts"><span>{Object.keys(progress).length} 道题有状态</span><span>{history.length} 条练习记录</span></div><div className="settings-actions"><button className="button primary" onClick={downloadLearningArchive}><Download size={18} aria-hidden="true" />导出学习档案</button><button className="button secondary" onClick={() => backupInputRef.current?.click()}><Upload size={18} aria-hidden="true" />导入学习档案</button><input ref={backupInputRef} name="learning-archive-file" className="sr-only" type="file" accept="application/json,.json" onChange={uploadLearningArchive} aria-label="选择青云问道学习档案 JSON" /></div></div>
      </section>

      <section className="settings-section danger-zone"><div className="settings-title"><span><Trash2 size={20} aria-hidden="true" /></span><div><h2>清空训练历史</h2><p>将删除 {history.length} 条练习记录与全部掌握度/收藏，当前题库不受影响。</p></div></div><button className="button danger" onClick={() => { if (window.confirm("确定清空全部训练历史吗？此操作不可撤销。")) { clearTrainingHistory(); setMessage("训练历史已清空。"); } }}><Trash2 size={18} aria-hidden="true" />清空训练历史</button></section>
    </div>
  );
}
