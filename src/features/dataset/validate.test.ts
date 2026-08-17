import rawDataset from "../../../public/data/default-dataset.json";
import { validateDataset, validateDefaultDataset } from "./validate";

describe("dataset validation", () => {
  it("keeps a golden validation boundary for the bundled 246-question dataset", () => {
    const dataset = validateDefaultDataset(rawDataset);
    expect(dataset.questions).toHaveLength(246);
    expect(dataset.schools).toHaveLength(12);
    expect(dataset.subjects).toHaveLength(14);
    expect(dataset.metadata.counts).toEqual({ total: 246, general: 143, school: 103, S: 133, A: 71, B: 42 });
    expect(new Set(dataset.questions.map((question) => question.id)).size).toBe(246);
  });

  it("accepts a custom school and question while recalculating metadata counts", () => {
    const clone = structuredClone(rawDataset) as unknown as {
      metadata: { counts: Record<string, number> };
      schools: Array<Record<string, unknown>>;
      questions: Array<Record<string, unknown>>;
    };
    clone.metadata.counts.total = 1;
    clone.schools.push({ id: "custom-university", name: "自定义大学" });
    clone.questions.push({
      id: "CUSTOM-001",
      subjectId: "data-structures",
      question: "请介绍你的自定义题目。",
      answer: { spoken: "这是一道用户自建题。" },
      schools: ["custom-university"],
      source: { type: "user-authored", label: "用户自建" },
    });
    const dataset = validateDataset(clone);
    expect(dataset.schools).toHaveLength(13);
    expect(dataset.questions).toHaveLength(247);
    expect(dataset.metadata.counts.total).toBe(247);
    expect(dataset.questions.at(-1)).toMatchObject({ scope: "school", priority: "A", followUps: [], mastery: 0 });
    expect(dataset.schools.at(-1)?.overview.evidenceLevel).toBe("用户自建");
  });

  it("rejects a verified screenshot question without a school", () => {
    const clone = structuredClone(rawDataset) as unknown as { questions: Array<{ source: { type: string }; schools: string[] }> };
    const verified = clone.questions.find((question) => question.source.type === "screenshot-verified");
    expect(verified).toBeDefined();
    verified!.schools = [];
    expect(() => validateDataset(clone)).toThrow(/截图真题|院校题/);
  });

  it("rejects silent loss only at the bundled default asset boundary", () => {
    const clone = structuredClone(rawDataset) as unknown as { questions: unknown[] };
    clone.questions.pop();
    expect(() => validateDefaultDataset(clone)).toThrow(/246/);
    expect(validateDataset(clone).questions).toHaveLength(245);
  });

  it("rejects an inverted review schedule", () => {
    const clone = structuredClone(rawDataset) as unknown as { reviewPolicy: { redDays: number; yellowDays: number } };
    clone.reviewPolicy.redDays = 8;
    clone.reviewPolicy.yellowDays = 2;
    expect(() => validateDataset(clone)).toThrow(/红题周期不能长于黄题周期/);
  });
});
