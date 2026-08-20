import type { OralAnswerStructure } from "../../models/dataset";

interface StructuredOralAnswerProps {
  fallback: string;
  structure?: OralAnswerStructure;
}

export function StructuredOralAnswer({ fallback, structure }: StructuredOralAnswerProps) {
  if (!structure) return <p className="legacy-spoken-answer">{fallback}</p>;

  return (
    <div className="oral-answer-structure">
      <div className="oral-answer-direct">
        <span>先答一句<small>先给老师结论</small></span>
        <p>{structure.direct}</p>
      </div>

      <div className="oral-answer-points">
        <p className="oral-answer-cue">再分点展开<small>沿着编号往下说</small></p>
        <ol aria-label="口述回答要点">
          {structure.points.map((point, index) => (
            <li key={`${point.title}-${index}`}>
              <span className="oral-point-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{point.title}</strong><p>{point.content}</p></div>
            </li>
          ))}
        </ol>
      </div>

      <div className="oral-answer-summary">
        <span>最后收住<small>把主线压成一句</small></span>
        <p>{structure.summary}</p>
      </div>
    </div>
  );
}
