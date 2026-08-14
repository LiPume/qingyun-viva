import rawDataset from "../../public/data/default-dataset.json";
import { validateDataset } from "../features/dataset/validate";
import type { QuestionProgress } from "../models/training";
import { buildRecommendationQueue, getNextReviewAt, getNextReviewDays, isDue, recommendationScore, streakDays } from "./training";

const dataset = validateDataset(rawDataset);

describe("review scheduling", () => {
  it("uses transparent 1/3/7/14 day intervals", () => {
    expect(getNextReviewDays(1, 0)).toBe(1);
    expect(getNextReviewDays(2, 0)).toBe(3);
    expect(getNextReviewDays(3, 1)).toBe(7);
    expect(getNextReviewDays(3, 2)).toBe(14);
    expect(getNextReviewDays(4, 1)).toBe(14);
  });

  it("calculates a stable due timestamp", () => {
    expect(getNextReviewAt(1, 0, new Date("2026-08-14T08:00:00.000Z"))).toBe("2026-08-15T08:00:00.000Z");
    expect(isDue({ questionId: "q", mastery: 1, favorite: false, totalPractices: 1, greenStreak: 0, nextReviewAt: "2026-08-14T08:00:00.000Z" }, new Date("2026-08-15T00:00:00.000Z"))).toBe(true);
  });
});

describe("recommendation queue", () => {
  it("ranks an overdue red question ahead of an unseen S question", () => {
    const red = dataset.questions.find((question) => question.priority === "B")!;
    const unseenS = dataset.questions.find((question) => question.priority === "S")!;
    const now = new Date("2026-08-14T12:00:00.000Z");
    const progress: Record<string, QuestionProgress> = {
      [red.id]: { questionId: red.id, mastery: 1, favorite: false, totalPractices: 1, greenStreak: 0, nextReviewAt: "2026-08-13T12:00:00.000Z" },
    };
    expect(recommendationScore(red, progress[red.id], null, [], now)).toBeGreaterThan(recommendationScore(unseenS, undefined, null, [], now));
    expect(buildRecommendationQueue(dataset, progress, null, 246, now).indexOf(red)).toBeLessThan(buildRecommendationQueue(dataset, progress, null, 246, now).indexOf(unseenS));
  });

  it("boosts verified questions for the selected school", () => {
    const verified = dataset.questions.find((question) => question.source.type === "screenshot-verified")!;
    expect(recommendationScore(verified, undefined, verified.schools[0], [], new Date())).toBeGreaterThanOrEqual(65);
  });
});

describe("practice streak", () => {
  it("counts consecutive calendar days", () => {
    const records = ["2026-08-12", "2026-08-13", "2026-08-14"].map((day, index) => ({ id: String(index), questionId: "q", practicedAt: `${day}T08:00:00.000Z`, mastery: 3 as const, followUpsAttempted: 0, followUpsPassed: 0, durationSeconds: 60, mode: "daily" as const }));
    expect(streakDays(records, new Date("2026-08-14T12:00:00.000Z"))).toBe(3);
  });
});
