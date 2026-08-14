import type { SourceType, VivaDataset, VivaQuestion } from "../../models/dataset";

const priorities = new Set(["S", "A", "B"]);
const sourceTypes = new Set<SourceType>([
  "source-document",
  "web-supplement",
  "screenshot-verified",
  "same-school-experience",
  "official-scope",
  "official-direction",
  "official-current",
  "official-ai-scope",
  "official-style-reference",
  "predicted-high-probability",
  "school-specific",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function assert(condition: unknown, path: string, message: string): asserts condition {
  if (!condition) throw new Error(`${path}: ${message}`);
}

function validateQuestion(value: unknown, index: number, subjectIds: Set<string>, schoolIds: Set<string>): VivaQuestion {
  const path = `questions[${index}]`;
  assert(isRecord(value), path, "must be an object");
  assert(typeof value.id === "string" && value.id.length > 0, `${path}.id`, "must be a non-empty string");
  assert(value.scope === "general" || value.scope === "school", `${path}.scope`, "must be general or school");
  assert(typeof value.subjectId === "string" && subjectIds.has(value.subjectId), `${path}.subjectId`, "unknown subject");
  assert(typeof value.subject === "string", `${path}.subject`, "must be a string");
  assert(typeof value.priority === "string" && priorities.has(value.priority), `${path}.priority`, "must be S, A, or B");
  assert(typeof value.question === "string" && value.question.trim().length > 0, `${path}.question`, "must not be empty");
  assert(isRecord(value.answer), `${path}.answer`, "must be an object");
  assert(typeof value.answer.spoken === "string" && value.answer.spoken.trim().length > 0, `${path}.answer.spoken`, "must not be empty");
  assert(typeof value.answer.explanation === "string", `${path}.answer.explanation`, "must be a string");
  assert(typeof value.answer.memoryHook === "string", `${path}.answer.memoryHook`, "must be a string");
  assert(Array.isArray(value.followUps) && value.followUps.every((item) => typeof item === "string"), `${path}.followUps`, "must be a string array");
  assert(Array.isArray(value.schools) && value.schools.every((item) => typeof item === "string" && schoolIds.has(item)), `${path}.schools`, "contains an unknown school");
  assert(value.scope !== "school" || value.schools.length > 0, `${path}.schools`, "school question needs a school");
  assert(isRecord(value.source), `${path}.source`, "must be an object");
  assert(typeof value.source.type === "string" && sourceTypes.has(value.source.type as SourceType), `${path}.source.type`, "unknown source type");
  assert(typeof value.source.label === "string", `${path}.source.label`, "must be a string");
  assert(value.source.type !== "screenshot-verified" || value.schools.length > 0, `${path}.schools`, "verified screenshot needs a school");
  assert(Array.isArray(value.tags) && value.tags.every((item) => typeof item === "string"), `${path}.tags`, "must be a string array");
  assert(Number.isInteger(value.mastery) && Number(value.mastery) >= 0 && Number(value.mastery) <= 4, `${path}.mastery`, "must be 0 through 4");
  return value as unknown as VivaQuestion;
}

export function validateDataset(value: unknown): VivaDataset {
  assert(isRecord(value), "dataset", "must be an object");
  assert(value.schemaVersion === 1, "schemaVersion", "must equal 1");
  assert(Array.isArray(value.subjects), "subjects", "must be an array");
  assert(Array.isArray(value.schools), "schools", "must be an array");
  assert(Array.isArray(value.questions), "questions", "must be an array");
  assert(value.schools.length === 12, "schools", "expected exactly 12 schools");
  assert(value.questions.length === 246, "questions", "expected exactly 246 questions");

  const subjectIds = new Set(value.subjects.map((item, index) => {
    assert(isRecord(item) && typeof item.id === "string", `subjects[${index}].id`, "must be a string");
    return item.id;
  }));
  const schoolIds = new Set(value.schools.map((item, index) => {
    assert(isRecord(item) && typeof item.id === "string", `schools[${index}].id`, "must be a string");
    return item.id;
  }));
  assert(subjectIds.size === value.subjects.length, "subjects", "ids must be unique");
  assert(schoolIds.size === value.schools.length, "schools", "ids must be unique");

  const questions = value.questions.map((item, index) => validateQuestion(item, index, subjectIds, schoolIds));
  assert(new Set(questions.map((question) => question.id)).size === 246, "questions", "ids must be unique");
  const counts = questions.reduce<Record<string, number>>((result, question) => {
    result[question.scope] = (result[question.scope] ?? 0) + 1;
    result[question.priority] = (result[question.priority] ?? 0) + 1;
    return result;
  }, {});
  assert(counts.general === 143 && counts.school === 103, "questions.scope", "expected general=143 and school=103");
  assert(counts.S === 133 && counts.A === 71 && counts.B === 42, "questions.priority", "expected S=133, A=71, B=42");
  return value as unknown as VivaDataset;
}
