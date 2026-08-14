import type { VivaDataset, VivaQuestion } from "../../models/dataset";

export interface MockConfig {
  durationMinutes: 10 | 15 | 20;
  count: 5 | 10 | 15 | 20;
  subjectId: string;
  schoolId: string;
  priorityMode: "S" | "SA";
  includeProjects: boolean;
}

export function selectMockQuestions(dataset: VivaDataset, config: MockConfig): VivaQuestion[] {
  let candidates = dataset.questions.filter((question) => {
    if (config.priorityMode === "S" && question.priority !== "S") return false;
    if (config.priorityMode === "SA" && question.priority === "B") return false;
    if (config.subjectId && question.subjectId !== config.subjectId) return false;
    if (config.schoolId && question.scope === "school" && !question.schools.includes(config.schoolId)) return false;
    if (!config.includeProjects && question.subjectId === "project-deep-dive") return false;
    return true;
  });
  if (config.schoolId) {
    candidates = candidates.sort((a, b) => Number(b.schools.includes(config.schoolId)) - Number(a.schools.includes(config.schoolId)));
  }

  const bySubject = new Map<string, VivaQuestion[]>();
  candidates.forEach((question) => {
    const group = bySubject.get(question.subjectId) ?? [];
    group.push(question);
    bySubject.set(question.subjectId, group);
  });
  const groups = [...bySubject.values()].map((group) => group.sort((a, b) => a.id.localeCompare(b.id)));
  const selected: VivaQuestion[] = [];
  let cursor = 0;
  while (selected.length < config.count && groups.some((group) => group.length > 0)) {
    const group = groups[cursor % groups.length];
    const projectCount = selected.filter((question) => question.subjectId === "project-deep-dive").length;
    const candidate = group.shift();
    if (candidate && (candidate.subjectId !== "project-deep-dive" || projectCount < Math.ceil(config.count * 0.3))) selected.push(candidate);
    cursor += 1;
  }
  return selected;
}
