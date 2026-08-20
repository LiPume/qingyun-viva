import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, ChevronDown, CirclePause, CirclePlay, Eye, RotateCcw, TimerReset } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MasteryBadge, PriorityBadge, SourceBadge } from "../components/ui/Badge";
import { StructuredOralAnswer } from "../components/training/StructuredOralAnswer";
import { useDataset } from "../features/dataset/DatasetContext";
import { useAppState } from "../features/training/AppStateContext";
import type { MasteryLevel } from "../models/dataset";
import type { FollowUpResult, PracticeMode } from "../models/training";

type TrainingPhase = "idle" | "answering" | "revealed" | "rated";

const ratings: Array<{ level: MasteryLevel; symbol: string; title: string; detail: string }> = [
  { level: 1, symbol: "●", title: "不会", detail: "1 天后再练" },
  { level: 2, symbol: "◐", title: "知道但说乱", detail: "3 天后再练" },
  { level: 3, symbol: "○", title: "能完整回答", detail: "7 天后再练" },
  { level: 4, symbol: "◆", title: "熟练，能接追问", detail: "14 天后再练" },
];

export function QuestionPage() {
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { dataset } = useDataset();
  const { progress, settings, recordPractice, toggleFavorite } = useAppState();
  const [phase, setPhase] = useState<TrainingPhase>("idle");
  const [duration, setDuration] = useState<45 | 60 | 90>(settings.timerSeconds);
  const [secondsLeft, setSecondsLeft] = useState<number>(duration);
  const [paused, setPaused] = useState(false);
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [followUpResults, setFollowUpResults] = useState<FollowUpResult[]>([]);
  const startedAt = useRef<number | null>(null);

  const question = dataset?.questions.find((item) => item.id === questionId);
  const questionIndex = dataset?.questions.findIndex((item) => item.id === questionId) ?? -1;
  const previous = dataset && questionIndex > 0 ? dataset.questions[questionIndex - 1] : null;
  const next = dataset && questionIndex >= 0 && questionIndex < dataset.questions.length - 1 ? dataset.questions[questionIndex + 1] : null;
  const state = question ? progress[question.id] : undefined;
  const mode = (searchParams.get("mode") ?? "question-bank") as PracticeMode;

  const submitRating = useCallback((level: MasteryLevel) => {
    if (!question || phase !== "revealed") return;
    const attempted = followUpResults.filter((result) => result !== "not-attempted").length;
    const passed = followUpResults.filter((result) => result === "passed").length;
    const durationSeconds = startedAt.current === null ? 0 : Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    recordPractice({
      questionId: question.id,
      mastery: level,
      followUpsAttempted: attempted,
      followUpsPassed: passed,
      durationSeconds,
      mode,
      ...(settings.currentSchoolId ? { schoolId: settings.currentSchoolId } : {}),
    });
    setPhase("rated");
  }, [followUpResults, mode, phase, question, recordPractice, settings.currentSchoolId]);

  useEffect(() => {
    if (phase !== "answering" || paused || secondsLeft <= 0) return;
    const interval = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [paused, phase, secondsLeft]);

  useEffect(() => {
    if (phase !== "revealed") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (["1", "2", "3", "4"].includes(event.key)) {
        const level = Number(event.key) as MasteryLevel;
        submitRating(level);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, submitRating]);

  if (!dataset || !question) return <div className="page empty-state"><h1>未找到这道题</h1><Link className="button secondary" to="/questions">返回题库</Link></div>;

  const startAnswering = () => {
    setSecondsLeft(duration);
    setPaused(false);
    setPhase("answering");
    startedAt.current = Date.now();
  };
  const revealAnswer = () => {
    setPhase("revealed");
    setPaused(true);
    setFollowUpIndex(question.followUps.length ? 1 : 0);
    setFollowUpResults(question.followUps.map(() => "not-attempted"));
  };
  const markFollowUp = (index: number, result: FollowUpResult) => {
    setFollowUpResults((current) => current.map((item, itemIndex) => itemIndex === index ? result : item));
  };
  return (
    <div className="page training-page">
      <nav className="training-breadcrumb" aria-label="题目导航">
        <Link to="/questions"><ArrowLeft size={17} />返回题库</Link>
        <span>{question.subject} · {questionIndex + 1}/{dataset.questions.length}</span>
        <div>{previous ? <Link to={`/question/${previous.id}`}>上一题</Link> : <span className="disabled" aria-disabled="true">上一题</span>}{next ? <Link to={`/question/${next.id}`}>下一题</Link> : <span className="disabled" aria-disabled="true">下一题</span>}</div>
      </nav>

      <article className={`oral-slip phase-${phase}`}>
        <div className="slip-index" aria-hidden="true">{String(questionIndex + 1).padStart(3, "0")}</div>
        <header>
          <div className="question-meta"><PriorityBadge priority={question.priority} /><SourceBadge type={question.source.type} label={question.source.label} />{question.schools.map((id) => <span key={id} className="badge school-badge">{dataset.schools.find((school) => school.id === id)?.name}</span>)}</div>
          <button className="icon-button" onClick={() => toggleFavorite(question.id)} aria-label={state?.favorite ? "取消收藏本题" : "收藏本题"}>{state?.favorite ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}</button>
        </header>
        <p className="slip-label">口试题签 · {question.subject}</p>
        <h1>{question.question}</h1>
        {state && <div className="previous-state"><span>上次记录</span><MasteryBadge mastery={state.mastery} /><span>累计 {state.totalPractices} 次</span></div>}

        {phase === "idle" && (
          <div className="answer-start">
            <fieldset><legend>选择口述时长</legend>{([45, 60, 90] as const).map((value) => <label key={value}><input type="radio" name="duration" value={value} checked={duration === value} onChange={() => { setDuration(value); setSecondsLeft(value); }} /><span>{value}<small>秒</small></span></label>)}</fieldset>
            <button className="button primary large" onClick={startAnswering}><CirclePlay size={21} />开始作答</button>
            <p>答案现在完全隐藏。先用 5 秒组织第一句话。</p>
          </div>
        )}

        {phase === "answering" && (
          <div className={`timer-stage ${secondsLeft <= 10 ? "ending" : ""}`}>
            <div className="timer-display" aria-label={`剩余 ${secondsLeft} 秒`}><span>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}</span><i>:</i><span>{String(secondsLeft % 60).padStart(2, "0")}</span></div>
            <p aria-live="polite">{secondsLeft === 0 ? "时间到。请说完当前这句，再查看答案。" : paused ? "计时已暂停" : "正在闭卷口述"}</p>
            <div><button className="button ghost" onClick={() => setPaused((value) => !value)}>{paused ? <CirclePlay size={19} /> : <CirclePause size={19} />}{paused ? "继续" : "暂停"}</button><button className="button primary" onClick={revealAnswer}><Eye size={19} />我答完了</button></div>
          </div>
        )}
      </article>

      {(phase === "revealed" || phase === "rated") && (
        <div className="reveal-stack">
          <section className="answer-section spoken-answer"><p className="section-number">I · 口述版</p><h2>先对照你刚才的表达</h2><StructuredOralAnswer fallback={question.answer.spoken} structure={question.answer.structure} /></section>
          {question.answer.explanation && <details className="answer-section" open><summary><span>II · 知识解析</span><ChevronDown size={18} /></summary><p className="answer-explanation">{question.answer.explanation}</p></details>}
          {question.answer.memoryHook && (!question.answer.structure || question.answer.memoryHook !== question.answer.structure.summary) && <aside className="memory-hook"><span>记忆钩子</span><p>{question.answer.memoryHook}</p></aside>}
          {question.followUps.length > 0 && <section className="answer-section follow-up-section"><p className="section-number">III · 追问链</p><h2>老师可能继续问</h2><div className="follow-up-list">{question.followUps.slice(0, followUpIndex).map((followUp, index) => <div className="follow-up-card" key={followUp}><span>追问 {index + 1}</span><p>{followUp}</p><div><button className={followUpResults[index] === "passed" ? "selected pass" : ""} onClick={() => markFollowUp(index, "passed")}><Check size={16} />接住了</button><button className={followUpResults[index] === "stuck" ? "selected stuck" : ""} onClick={() => markFollowUp(index, "stuck")}><RotateCcw size={16} />卡住了</button></div></div>)}</div>{followUpIndex < question.followUps.length && <button className="button secondary" onClick={() => setFollowUpIndex((value) => value + 1)}>下一追问 <ArrowRight size={17} /></button>}</section>}
          <details className="answer-section source-note"><summary><span>IV · 来源与证据</span><ChevronDown size={18} /></summary><SourceBadge type={question.source.type} label={question.source.label} /><p>{question.source.reference || "题目来自原始口述版资料，未额外改写事实口径。"}</p></details>

          {phase === "revealed" ? <section className="self-rating" aria-labelledby="rating-heading"><p className="eyebrow">Self assessment · 键盘 1–4</p><h2 id="rating-heading">刚才闭卷回答到什么程度？</h2><div>{ratings.map((rating) => <button key={rating.level} className={`rating rating-${rating.level}`} onClick={() => submitRating(rating.level)}><span>{rating.symbol}</span><strong>{rating.title}</strong><small>{rating.detail}</small><kbd>{rating.level}</kbd></button>)}</div></section> : (
            <section className="rating-success" aria-live="polite"><Check size={28} /><div><h2>本次口述已记录</h2><p>只有完成自评才算正式练习，下次复习时间已更新。</p></div>{next ? <button className="button primary" onClick={() => navigate(`/question/${next.id}?mode=${mode}`)}>继续下一题 <ArrowRight size={18} /></button> : <Link className="button primary" to="/">返回今日研习</Link>}</section>
          )}
        </div>
      )}
      <footer className="training-footer"><TimerReset size={17} /><span>倒计时到 0 也不会自动跳转，请完整说完你的最后一句。</span></footer>
    </div>
  );
}
