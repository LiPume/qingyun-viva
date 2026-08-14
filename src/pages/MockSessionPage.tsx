import { ArrowRight, Check, Clock3, DoorOpen, MessageCircleQuestion } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PriorityBadge, SourceBadge } from "../components/ui/Badge";
import { useDataset } from "../features/dataset/DatasetContext";
import { useAppState } from "../features/training/AppStateContext";
import type { MasteryLevel } from "../models/dataset";
import { mockSessionKey, type StoredMockSession } from "./MockPage";

function readSession(id: string): StoredMockSession | null {
  try {
    const raw = sessionStorage.getItem(mockSessionKey(id));
    return raw ? JSON.parse(raw) as StoredMockSession : null;
  } catch { return null; }
}

export function MockSessionPage() {
  const { sessionId = "" } = useParams();
  const { dataset } = useDataset();
  const { recordPractice } = useAppState();
  const navigate = useNavigate();
  const [session, setSession] = useState<StoredMockSession | null>(() => readSession(sessionId));
  const [secondsLeft, setSecondsLeft] = useState(() => session ? Math.max(0, session.config.durationMinutes * 60 - Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)) : 0);
  const [showFollowUp, setShowFollowUp] = useState(false);

  useEffect(() => {
    if (!session || secondsLeft <= 0) return;
    const interval = window.setInterval(() => setSecondsLeft(Math.max(0, session.config.durationMinutes * 60 - Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000))), 1000);
    return () => window.clearInterval(interval);
  }, [secondsLeft, session]);

  if (!dataset || !session) return <div className="mock-missing"><h1>未找到本场模拟面试</h1><Link className="button secondary" to="/mock">重新生成</Link></div>;
  const question = dataset.questions.find((item) => item.id === session.questionIds[session.currentIndex]);
  if (!question) return <div className="mock-missing"><h1>本场题目已失效</h1><Link className="button secondary" to="/mock">返回模拟设置</Link></div>;
  const followUp = session.followUps[question.id];

  const rateAndContinue = (mastery: MasteryLevel) => {
    const next: StoredMockSession = { ...session, ratings: { ...session.ratings, [question.id]: mastery as 1 | 2 | 3 | 4 } };
    if (session.currentIndex < session.questionIds.length - 1) {
      next.currentIndex += 1;
      sessionStorage.setItem(mockSessionKey(session.id), JSON.stringify(next));
      setSession(next);
      setShowFollowUp(false);
      return;
    }
    next.completedAt = new Date().toISOString();
    if (!next.committed) {
      next.questionIds.forEach((id) => recordPractice({ questionId: id, mastery: next.ratings[id] ?? 1, followUpsAttempted: next.followUps[id] ? 1 : 0, followUpsPassed: 0, durationSeconds: Math.max(1, Math.floor((Date.now() - new Date(next.startedAt).getTime()) / next.questionIds.length / 1000)), mode: "mock", ...(next.config.schoolId ? { schoolId: next.config.schoolId } : {}) }));
      next.committed = true;
    }
    sessionStorage.setItem(mockSessionKey(session.id), JSON.stringify(next));
    navigate(`/mock/report/${session.id}`);
  };

  return (
    <div className="mock-session">
      <header className="mock-session-header"><div className="mock-brand"><span>问</span><strong>青云问道</strong><small>模拟口试</small></div><div className={`mock-clock ${secondsLeft <= 60 ? "ending" : ""}`} aria-label={`本场剩余 ${secondsLeft} 秒`}><Clock3 size={18} /><span>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</span></div><Link to="/mock" className="exit-link"><DoorOpen size={17} />退出本场</Link></header>
      <div className="mock-progress"><span style={{ width: `${((session.currentIndex + 1) / session.questionIds.length) * 100}%` }} /></div>
      <main className="mock-question-stage"><p className="eyebrow">Question {String(session.currentIndex + 1).padStart(2, "0")} / {String(session.questionIds.length).padStart(2, "0")}</p><div className="question-meta"><PriorityBadge priority={question.priority} /><span>{question.subject}</span><SourceBadge type={question.source.type} label={question.source.label} /></div><h1>{question.question}</h1>
        {followUp && !showFollowUp && <button className="button secondary" onClick={() => setShowFollowUp(true)}><MessageCircleQuestion size={18} />我已完成首答，抽取追问</button>}
        {followUp && showFollowUp && <aside className="mock-follow-up"><span>随机追问</span><p>{followUp}</p></aside>}
      </main>
      <footer className="mock-rating"><p>完成本题后自评；提交后不能返回修改。</p><div>{[
        [1, "●", "不会"], [2, "◐", "说乱"], [3, "○", "完整"], [4, "◆", "熟练"],
      ].map(([level, symbol, label]) => <button key={level} className={`mock-rate rate-${level}`} onClick={() => rateAndContinue(level as MasteryLevel)}><span>{symbol}</span>{label}{session.currentIndex === session.questionIds.length - 1 && level === 4 ? <Check size={16} /> : <ArrowRight size={16} />}</button>)}</div></footer>
    </div>
  );
}
