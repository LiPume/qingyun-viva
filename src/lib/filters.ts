import type { MasteryLevel, VivaDataset, VivaQuestion } from "../models/dataset";
import type { QuestionProgress } from "../models/training";
import { isDue, isHighFrequency, isToday } from "./training";

export interface QuestionFilters {
  query: string;
  subjectId: string;
  priority: string;
  schoolId: string;
  sourceType: string;
  practice: string;
  mastery: string;
  favorite: boolean;
  highFrequency: boolean;
  targetSchoolsOnly: boolean;
}

export const emptyFilters: QuestionFilters = {
  query: "",
  subjectId: "",
  priority: "",
  schoolId: "",
  sourceType: "",
  practice: "",
  mastery: "",
  favorite: false,
  highFrequency: false,
  targetSchoolsOnly: false,
};

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, " ");

export function filterQuestions(
  dataset: VivaDataset,
  progress: Record<string, QuestionProgress>,
  filters: QuestionFilters,
  now = new Date(),
): VivaQuestion[] {
  const query = normalize(filters.query);
  const schoolNames = new Map(dataset.schools.map((school) => [school.id, school.name]));
  return dataset.questions.filter((question) => {
    const state = progress[question.id];
    const searchable = normalize([
      question.question,
      question.answer.spoken,
      question.answer.explanation,
      question.subject,
      ...question.tags,
      ...question.schools.map((id) => schoolNames.get(id) ?? id),
    ].join(" "));
    if (query && !searchable.includes(query)) return false;
    if (filters.subjectId && question.subjectId !== filters.subjectId) return false;
    if (filters.priority && question.priority !== filters.priority) return false;
    if (filters.schoolId && !question.schools.includes(filters.schoolId)) return false;
    if (filters.sourceType && question.source.type !== filters.sourceType) return false;
    if (filters.mastery && (state?.mastery ?? 0) !== Number(filters.mastery) as MasteryLevel) return false;
    if (filters.favorite && !state?.favorite) return false;
    if (filters.highFrequency && !isHighFrequency(question, dataset.crossSchoolHighFrequency)) return false;
    if (filters.targetSchoolsOnly && question.scope !== "school") return false;
    if (filters.practice === "unseen" && state?.totalPractices) return false;
    if (filters.practice === "practiced" && !state?.totalPractices) return false;
    if (filters.practice === "today" && !isToday(state?.lastPracticedAt, now)) return false;
    if (filters.practice === "due" && !isDue(state, now)) return false;
    return true;
  });
}
