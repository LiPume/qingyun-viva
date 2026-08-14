import type { MasteryLevel, VivaDataset, VivaQuestion } from "../models/dataset";
import type { PracticeRecord, QuestionProgress } from "../models/training";

export function getNextReviewDays(level: MasteryLevel, greenStreak: number): number {
  if (level === 1) return 1;
  if (level === 2) return 3;
  if (level === 3) return greenStreak >= 2 ? 14 : 7;
  if (level === 4) return 14;
  return 0;
}

export function getNextReviewAt(level: MasteryLevel, greenStreak: number, practicedAt: Date): string | undefined {
  const days = getNextReviewDays(level, greenStreak);
  if (days === 0) return undefined;
  const next = new Date(practicedAt);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function isDue(progress: QuestionProgress | undefined, now = new Date()): boolean {
  if (!progress?.nextReviewAt) return false;
  return new Date(progress.nextReviewAt).getTime() <= now.getTime();
}

export function isToday(iso: string | undefined, now = new Date()): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export function isHighFrequency(question: VivaQuestion, themes: string[]): boolean {
  return themes.some((theme) => {
    const key = theme.split(/[：/]/)[0].replace(/与|和/g, "").trim();
    const fragments = key.split(/[、\s]+/).filter((fragment) => fragment.length >= 2);
    return fragments.some((fragment) => question.question.includes(fragment));
  });
}

export function recommendationScore(
  question: VivaQuestion,
  progress: QuestionProgress | undefined,
  currentSchoolId: string | null,
  highFrequencyThemes: string[],
  now = new Date(),
): number {
  let score = 0;
  if (progress?.mastery === 1 && isDue(progress, now)) score += 100;
  if (progress?.mastery === 2 && isDue(progress, now)) score += 80;
  if (currentSchoolId && question.schools.includes(currentSchoolId) && question.source.type === "screenshot-verified") score += 65;
  if (currentSchoolId && question.schools.includes(currentSchoolId) && ["official-scope", "official-direction", "official-current", "official-ai-scope"].includes(question.source.type)) score += 55;
  if (!progress?.totalPractices && question.priority === "S") score += 50;
  if (question.priority === "S" && progress?.lastPracticedAt && now.getTime() - new Date(progress.lastPracticedAt).getTime() > 7 * 86_400_000) score += 35;
  if (question.priority === "A" && isDue(progress, now)) score += 25;
  if (isHighFrequency(question, highFrequencyThemes)) score += 15;
  if (isToday(progress?.lastPracticedAt, now)) score -= 30;
  return score;
}

export function buildRecommendationQueue(
  dataset: VivaDataset,
  progress: Record<string, QuestionProgress>,
  currentSchoolId: string | null,
  limit = 12,
  now = new Date(),
): VivaQuestion[] {
  return [...dataset.questions]
    .map((question) => ({
      question,
      score: recommendationScore(question, progress[question.id], currentSchoolId, dataset.crossSchoolHighFrequency, now),
      last: progress[question.id]?.lastPracticedAt ?? "",
    }))
    .sort((a, b) => b.score - a.score || a.last.localeCompare(b.last) || a.question.id.localeCompare(b.question.id))
    .slice(0, limit)
    .map((entry) => entry.question);
}

export function streakDays(history: PracticeRecord[], now = new Date()): number {
  const practicedDays = new Set(history.map((record) => record.practicedAt.slice(0, 10)));
  let count = 0;
  const cursor = new Date(now);
  while (practicedDays.has(cursor.toISOString().slice(0, 10))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function masteryLabel(level: MasteryLevel): string {
  return ["未练", "红 · 不会", "黄 · 说乱", "绿 · 完整", "熟练 · 能追问"][level];
}
