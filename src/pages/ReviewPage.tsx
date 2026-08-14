import { ArrowRight, BookMarked, CalendarClock, Heart, History, MessageCircleWarning } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { QuestionRow } from "../components/QuestionRow";
import { useDataset } from "../features/dataset/DatasetContext";
import { useAppState } from "../features/training/AppStateContext";
import { isDue } from "../lib/training";

const tabs = [
  { id: "due", label: "到期", icon: CalendarClock },
  { id: "weak", label: "红黄题", icon: History },
  { id: "followup", label: "追问卡壳", icon: MessageCircleWarning },
  { id: "favorites", label: "收藏", icon: Heart },
] as const;

export function ReviewPage() {
  const { dataset } = useDataset();
  const { progress, history, toggleFavorite } = useAppState();
  const [params, setParams] = useSearchParams();
  const currentTab = params.get("tab") ?? "due";
  if (!dataset) return null;
  const questions = dataset.questions.filter((question) => {
    const item = progress[question.id];
    if (currentTab === "due") return isDue(item);
    if (currentTab === "weak") return item?.mastery === 1 || item?.mastery === 2;
    if (currentTab === "followup") return item?.lastFollowUpResult === "stuck";
    return item?.favorite;
  });
  const counts = {
    due: dataset.questions.filter((question) => isDue(progress[question.id])).length,
    weak: dataset.questions.filter((question) => [1, 2].includes(progress[question.id]?.mastery)).length,
    followup: dataset.questions.filter((question) => progress[question.id]?.lastFollowUpResult === "stuck").length,
    favorites: dataset.questions.filter((question) => progress[question.id]?.favorite).length,
  };
  const periods = [1, 7, 30].map((days) => history.filter((record) => Date.now() - new Date(record.practicedAt).getTime() < days * 86_400_000).length);

  return (
    <div className="page review-page">
      <header className="page-header cloud-divider"><div><p className="eyebrow">Review ledger</p><h1>复习簿</h1><p>把不会、说乱和追问卡壳的地方，变成下一次行动。</p></div><div className="review-periods"><span><strong>{periods[0]}</strong>今日</span><span><strong>{periods[1]}</strong>7 日</span><span><strong>{periods[2]}</strong>30 日</span></div></header>
      <nav className="review-tabs" aria-label="复习簿分类">{tabs.map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={currentTab === id} onClick={() => setParams({ tab: id })}><Icon size={18} /><span>{label}</span><strong>{counts[id]}</strong></button>)}</nav>
      <section className="section-panel">
        <div className="section-heading"><div><p className="eyebrow">{tabs.find((tab) => tab.id === currentTab)?.label}</p><h2>{questions.length ? `待重新开口的 ${questions.length} 题` : "这一页暂时清空"}</h2></div>{questions[0] && <Link className="button primary" to={`/question/${questions[0].id}?mode=review`}><BookMarked size={18} />开始复习本页 <ArrowRight size={17} /></Link>}</div>
        {questions.length ? <div className="question-list">{questions.map((question) => <QuestionRow key={question.id} question={question} progress={progress[question.id]} onToggleFavorite={toggleFavorite} />)}</div> : <div className="empty-state"><BookMarked size={30} /><h2>暂无待复习题签</h2><p>完成几道正式口述并自评后，这里会自动收集需要回炉的内容。</p><Link className="button secondary" to="/questions">去题库开口</Link></div>}
      </section>
    </div>
  );
}
