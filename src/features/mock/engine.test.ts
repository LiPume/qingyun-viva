import rawDataset from "../../../public/data/default-dataset.json";
import { validateDataset } from "../dataset/validate";
import { selectMockQuestions } from "./engine";

const dataset = validateDataset(rawDataset);

describe("selectMockQuestions", () => {
  it("returns the requested count and rotates subjects", () => {
    const questions = selectMockQuestions(dataset, { durationMinutes: 10, count: 10, subjectId: "", schoolId: "", priorityMode: "SA", includeProjects: true });
    expect(questions).toHaveLength(10);
    expect(new Set(questions.map((question) => question.subjectId)).size).toBeGreaterThan(5);
    expect(questions.filter((question) => question.subjectId === "project-deep-dive").length).toBeLessThanOrEqual(3);
  });

  it("honors S-only and subject filters", () => {
    const questions = selectMockQuestions(dataset, { durationMinutes: 10, count: 5, subjectId: "computer-networks", schoolId: "", priorityMode: "S", includeProjects: false });
    expect(questions).toHaveLength(5);
    expect(questions.every((question) => question.subjectId === "computer-networks" && question.priority === "S")).toBe(true);
  });
});
