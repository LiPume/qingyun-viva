import { Bookmark, BookmarkCheck, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { VivaQuestion } from "../models/dataset";
import type { QuestionProgress } from "../models/training";
import { isDue } from "../lib/training";
import { MasteryBadge, PriorityBadge, SourceBadge } from "./ui/Badge";

export function QuestionRow({
  question,
  progress,
  reason,
  onToggleFavorite,
}: {
  question: VivaQuestion;
  progress?: QuestionProgress;
  reason?: string;
  onToggleFavorite: (questionId: string) => void;
}) {
  return (
    <article className="question-row">
      <div className={`priority-rail priority-rail-${question.priority.toLowerCase()}`} aria-hidden="true" />
      <div className="question-row-main">
        <div className="question-meta">
          <PriorityBadge priority={question.priority} />
          <span>{question.subject}</span>
          <SourceBadge type={question.source.type} label={question.source.label} />
        </div>
        <h3><Link to={`/question/${question.id}`}>{question.question}</Link></h3>
        <div className="question-foot">
          {reason && <span className="recommendation-reason">{reason}</span>}
          <MasteryBadge mastery={progress?.mastery ?? 0} due={isDue(progress)} />
        </div>
      </div>
      <div className="question-actions">
        <button
          className="icon-button"
          onClick={() => onToggleFavorite(question.id)}
          aria-label={progress?.favorite ? `取消收藏：${question.question}` : `收藏：${question.question}`}
        >
          {progress?.favorite ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
        </button>
        <Link className="icon-button" to={`/question/${question.id}`} aria-label={`开始练习：${question.question}`}>
          <ChevronRight size={20} />
        </Link>
      </div>
    </article>
  );
}
