import { ArrowRight, CalendarClock, Flame, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { QuestionRow } from "../components/QuestionRow";
import { useDataset } from "../features/dataset/DatasetContext";
import { useAppState } from "../features/training/AppStateContext";
import { buildRecommendationQueue, isDue, isToday, streakDays } from "../lib/training";
import type { VivaQuestion } from "../models/dataset";

function reasonFor(question: VivaQuestion, currentSchoolId: string | null, mastery = 0, due = false): string {
  if (due && mastery === 1) return "红题到期，今日先破除卡点";
  if (due && mastery === 2) return "黄题到期，重新组织表达";
  if (currentSchoolId && question.schools.includes(currentSchoolId) && question.source.type === "screenshot-verified") return "当前院校的已核验真题";
  if (currentSchoolId && question.schools.includes(currentSchoolId) && question.source.type.startsWith("official")) return "当前院校的官方范围";
  if (question.priority === "S" && mastery === 0) return "从未正式开口的 S 级题";
  return "高优先级口述题";
}

export function DashboardPage() {
  const { dataset } = useDataset();
  const { progress, history, settings, toggleFavorite } = useAppState();
  if (!dataset) return null;
  const now = new Date();
  const queue = buildRecommendationQueue(dataset, progress, settings.currentSchoolId, settings.dailyGoal, now);
  const todayCount = history.filter((record) => isToday(record.practicedAt, now)).length;
  const dueCount = Object.values(progress).filter((item) => isDue(item, now)).length;
  const weakCount = Object.values(progress).filter((item) => item.mastery === 1 || item.mastery === 2).length;
  const sQuestions = dataset.questions.filter((question) => question.priority === "S");
  const sCovered = sQuestions.filter((question) => (progress[question.id]?.totalPractices ?? 0) > 0).length;
  const sCoverage = Math.round((sCovered / sQuestions.length) * 100);
  const school = dataset.schools.find((item) => item.id === settings.currentSchoolId);

  return (
    <div className="page dashboard-page">
      <header className="editorial-header cloud-divider">
        <div>
          <p className="eyebrow">{new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(now)} · 第 {Math.min(28, Math.floor((now.getDate() - 1) % 28) + 1)} 日</p>
          <h1>今日不求看完，只求说清。</h1>
          <p>{school ? `${school.name}模式已开启，优先练该校真题与官方范围。` : "从到期错题和未开口的 S 级题开始。"}</p>
        </div>
        <div className="daily-callout">
          <span>今日目标</span>
          <strong>{todayCount}<small> / {settings.dailyGoal} 题</small></strong>
          <div className="progress-track" aria-label={`今日完成 ${todayCount} / ${settings.dailyGoal}`}>
            <span style={{ width: `${Math.min(100, (todayCount / settings.dailyGoal) * 100)}%` }} />
          </div>
          {queue[0] && <Link className="button primary" to={`/question/${queue[0].id}?mode=daily`}>开始今日口述 <ArrowRight size={18} /></Link>}
        </div>
      </header>

      <section className="metric-strip" aria-label="学习摘要">
        <div><CalendarClock aria-hidden="true" /><span>到期复习</span><strong>{dueCount}</strong><small>题等待回答</small></div>
        <div><Target aria-hidden="true" /><span>S 级覆盖</span><strong>{sCoverage}%</strong><small>{sCovered} / {sQuestions.length} 已开口</small></div>
        <div><Flame aria-hidden="true" /><span>连续研习</span><strong>{streakDays(history, now)}</strong><small>天保持记录</small></div>
        <div><span className="weak-symbol" aria-hidden="true">温</span><span>需回炉</span><strong>{weakCount}</strong><small>道红黄题</small></div>
      </section>

      <div className="dashboard-grid">
        <section className="section-panel queue-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Recommended queue</p><h2>今日题笺</h2></div>
            <Link to="/questions">查看全部 <ArrowRight size={16} /></Link>
          </div>
          <div className="question-list">
            {queue.slice(0, 6).map((question) => (
              <QuestionRow
                key={question.id}
                question={question}
                progress={progress[question.id]}
                reason={reasonFor(question, settings.currentSchoolId, progress[question.id]?.mastery, isDue(progress[question.id]))}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
        <aside className="section-panel study-plan">
          <p className="eyebrow">28-day cadence</p>
          <h2>四周研习谱</h2>
          <ol>
            {dataset.studyGuide.plan28Days.slice(0, 7).map((item, index) => (
              <li key={item.day} className={index === 0 ? "current" : ""}><span>{item.day}</span><p>{item.theme}</p></li>
            ))}
          </ol>
          <p className="plan-note">{dataset.studyGuide.dailyRoutine}</p>
        </aside>
      </div>

      <section className="subject-spines">
        <div className="section-heading"><div><p className="eyebrow">Subject coverage</p><h2>科目书脊</h2></div></div>
        <div className="spine-grid">
          {dataset.subjects.map((subject) => {
            const questions = dataset.questions.filter((question) => question.subjectId === subject.id);
            const practiced = questions.filter((question) => progress[question.id]?.totalPractices).length;
            const percentage = questions.length ? Math.round((practiced / questions.length) * 100) : 0;
            return <Link key={subject.id} to={`/questions?subject=${subject.id}`} className="subject-spine"><span>{subject.name}</span><strong>{percentage}%</strong><i style={{ height: `${Math.max(4, percentage)}%` }} /></Link>;
          })}
        </div>
      </section>
    </div>
  );
}
