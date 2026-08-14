import rawDataset from "../../../public/data/default-dataset.json";
import { validateDataset } from "./validate";

describe("validateDataset", () => {
  it("accepts all 246 questions and preserves the required distributions", () => {
    const dataset = validateDataset(rawDataset);
    expect(dataset.questions).toHaveLength(246);
    expect(dataset.schools).toHaveLength(12);
    expect(dataset.questions.filter((question) => question.scope === "general")).toHaveLength(143);
    expect(dataset.questions.filter((question) => question.scope === "school")).toHaveLength(103);
    expect(dataset.questions.filter((question) => question.priority === "S")).toHaveLength(133);
    expect(dataset.questions.filter((question) => question.priority === "A")).toHaveLength(71);
    expect(dataset.questions.filter((question) => question.priority === "B")).toHaveLength(42);
    expect(new Set(dataset.questions.map((question) => question.id)).size).toBe(246);
  });

  it("rejects a verified screenshot question without a school", () => {
    const clone = structuredClone(rawDataset) as unknown as { questions: Array<{ source: { type: string }; schools: string[] }> };
    const verified = clone.questions.find((question) => question.source.type === "screenshot-verified");
    expect(verified).toBeDefined();
    verified!.schools = [];
    expect(() => validateDataset(clone)).toThrow(/verified screenshot needs a school|school question needs a school/);
  });

  it("rejects silent question loss", () => {
    const clone = structuredClone(rawDataset) as unknown as { questions: unknown[] };
    clone.questions.pop();
    expect(() => validateDataset(clone)).toThrow(/expected exactly 246 questions/);
  });
});
