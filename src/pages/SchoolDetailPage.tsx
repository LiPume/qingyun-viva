import { ArrowLeft, ArrowRight, CheckCircle2, Crosshair, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { QuestionRow } from "../components/QuestionRow";
import { useDataset } from "../features/dataset/DatasetContext";
import { useAppState } from "../features/training/AppStateContext";

function formatDatasetDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未标注日期" : new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(date);
}

export function SchoolDetailPage() {
  const { schoolId } = useParams();
  const { dataset } = useDataset();
  const { progress, settings, setCurrentSchool, toggleFavorite } = useAppState();
  const school = dataset?.schools.find((item) => item.id === schoolId);
  if (!dataset || !school) return <div className="page empty-state"><h1>未找到该院校</h1><Link className="button secondary" to="/schools">返回院校列表</Link></div>;
  const questions = dataset.questions.filter((question) => question.schools.includes(school.id));
  const mastered = questions.filter((question) => (progress[question.id]?.mastery ?? 0) >= 3).length;
  const sources = [...new Set(questions.map((question) => question.source.label))];
  const active = settings.currentSchoolId === school.id;

  return (
    <div className="page school-detail-page">
      <Link className="back-link" to="/schools"><ArrowLeft size={17} />返回院校列表</Link>
      <header className="school-hero cloud-divider">
        <div><p className="eyebrow">Target school dossier</p><h1>{school.name}</h1><p className="school-direction">{school.overview.direction}</p><div className="verified-date"><ShieldCheck size={17} aria-hidden="true" />题库信息版本 {formatDatasetDate(dataset.metadata.generatedAt)} · {school.overview.evidenceLevel}</div></div>
        <div className="school-hero-actions"><button className={`button ${active ? "secondary" : "primary"}`} onClick={() => setCurrentSchool(active ? null : school.id)}><Crosshair size={18} />{active ? "退出当前模式" : "设为当前模式"}</button>{questions[0] && <Link className="button primary" to={`/question/${questions[0].id}?mode=school`}>只练该校 <ArrowRight size={18} /></Link>}</div>
      </header>
      <section className="school-intel-grid">
        <article><span>当前可核验考情</span><p>{school.assessmentSummary}</p></article>
        <article><span>优先准备方向</span><h2>{school.overview.priorityPrep}</h2><p>{school.practiceNote}</p></article>
        <article><span>证据说明</span><p>{school.evidenceText}</p></article>
      </section>
      <section className="school-question-summary">
        <div><span>院校题量</span><strong>{questions.length}</strong></div><div><span>已练</span><strong>{questions.filter((question) => progress[question.id]?.totalPractices).length}</strong></div><div><span>已掌握</span><strong>{mastered}</strong></div><div><span>来源分层</span><strong>{sources.length}</strong></div>
      </section>
      <section className="section-panel">
        <div className="section-heading"><div><p className="eyebrow">Evidence-aware prompts</p><h2>{school.name}题签</h2></div><span>{sources.join(" · ")}</span></div>
        <div className="question-list">{questions.map((question) => <QuestionRow key={question.id} question={question} progress={progress[question.id]} onToggleFavorite={toggleFavorite} />)}</div>
      </section>
      {active && <div className="mode-confirmation" role="status"><CheckCircle2 size={18} /><span>已将 {school.name} 提高到 Dashboard 推荐队列的最前方。</span></div>}
    </div>
  );
}
