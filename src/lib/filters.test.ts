import rawDataset from "../../public/data/default-dataset.json";
import { validateDataset } from "../features/dataset/validate";
import { emptyFilters, filterQuestions } from "./filters";

const dataset = validateDataset(rawDataset);

describe("filterQuestions", () => {
  it("searches questions and spoken answers", () => {
    const byQuestion = filterQuestions(dataset, {}, { ...emptyFilters, query: "哈希冲突" });
    expect(byQuestion.length).toBeGreaterThan(0);
    const phrase = dataset.questions[0].answer.spoken.slice(0, 12);
    expect(filterQuestions(dataset, {}, { ...emptyFilters, query: phrase }).map((question) => question.id)).toContain(dataset.questions[0].id);
    expect(filterQuestions(dataset, {}, { ...emptyFilters, query: "哈希三件套" }).map((question) => question.id)).toContain(dataset.questions[0].id);
  });

  it("combines school, priority, and source filters", () => {
    const results = filterQuestions(dataset, {}, { ...emptyFilters, schoolId: "fudan", priority: "S", sourceType: "screenshot-verified" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((question) => question.schools.includes("fudan") && question.priority === "S" && question.source.type === "screenshot-verified")).toBe(true);
  });

  it("filters user progress without mutating dataset defaults", () => {
    const target = dataset.questions[0];
    const progress = { [target.id]: { questionId: target.id, mastery: 2 as const, favorite: true, totalPractices: 1, greenStreak: 0 } };
    expect(filterQuestions(dataset, progress, { ...emptyFilters, favorite: true })).toEqual([target]);
    expect(target.favorite).toBe(false);
  });
});
