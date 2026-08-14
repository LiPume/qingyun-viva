import { ArrowRight, CheckCircle2, RotateCcw, Target } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { MasteryBadge } from "../components/ui/Badge";
import { useDataset } from "../features/dataset/DatasetContext";
import { mockSessionKey, type StoredMockSession } from "./MockPage";

export function MockReportPage() {
  const { sessionId = "" } = useParams();
  const { dataset } = useDataset();
  let session: StoredMockSession | null = null;
  try { const raw = sessionStorage.getItem(mockSessionKey(sessionId)); session = raw ? JSON.parse(raw) as StoredMockSession : null; } catch { session = null; }
  if (!dataset || !session?.completedAt) return <div className="page empty-state"><h1>还没有可复盘的本场记录</h1><Link className="button secondary" to="/mock">返回模拟面试</Link></div>;
  const questions = session.questionIds.flatMap((id) => { const question = dataset.questions.find((item) => item.id === id); return question ? [question] : []; });
  const counts = [1, 2, 3, 4].map((level) => questions.filter((question) => session?.ratings[question.id] === level).length);
  const weak = questions.filter((question) => (session?.ratings[question.id] ?? 1) <= 2);
  const subjectWeak = [...new Set(weak.map((question) => question.subject))];
  const school = dataset.schools.find((item) => item.id === session.config.schoolId);

  return (
    <div className="page mock-report-page">
      <header className="report-hero"><CheckCircle2 size={38} /><div><p className="eyebrow">Session complete</p><h1>本场口试已完成</h1><p>{session.config.durationMinutes} 分钟配置 · {questions.length} 题 · {school?.name ?? "全科模式"}</p></div><Link className="button secondary" to="/mock"><RotateCcw size={18} />再练一场</Link></header>
      <section className="report-metrics"><div><span>本场题数</span><strong>{questions.length}</strong></div><div><span>红 / 黄</span><strong>{counts[0]} / {counts[1]}</strong></div><div><span>绿 / 熟练</span><strong>{counts[2]} / {counts[3]}</strong></div><div><span>需回炉科目</span><strong>{subjectWeak.length}</strong></div></section>
      <section className="section-panel report-review"><div className="section-heading"><div><p className="eyebrow">Priority review</p><h2>先回炉这 {weak.length} 题</h2></div>{weak[0] && <Link className="button primary" to={`/question/${weak[0].id}?mode=review`}><Target size={18} />开始回炉 <ArrowRight size={17} /></Link>}</div>{weak.length ? <div className="report-question-list">{weak.map((question) => <Link key={question.id} to={`/question/${question.id}?mode=review`}><span>{question.subject}</span><p>{question.question}</p><MasteryBadge mastery={session?.ratings[question.id] ?? 1} /></Link>)}</div> : <div className="empty-state"><CheckCircle2 size={28} /><h2>本场无红黄题</h2><p>下一场可增加题数或只练 S 级。</p></div>}</section>
      <section className="section-panel"><div className="section-heading"><div><p className="eyebrow">Full session</p><h2>全部题目记录</h2></div></div><div className="report-question-list">{questions.map((question) => <Link key={question.id} to={`/question/${question.id}`}><span>{question.subject}</span><p>{question.question}</p><MasteryBadge mastery={session?.ratings[question.id] ?? 1} /></Link>)}</div></section>
    </div>
  );
}
