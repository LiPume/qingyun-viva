import type {
  MasteryLevel,
  OralAnswerStructure,
  ReviewPolicy,
  School,
  SourceType,
  Subject,
  VivaDataset,
  VivaQuestion,
} from "../../models/dataset";

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
  "user-authored",
]);

export const DEFAULT_REVIEW_POLICY: ReviewPolicy = {
  redDays: 1,
  yellowDays: 3,
  greenDays: 7,
  greenStreak2Days: 14,
  description: "红题 1 天、黄题 3 天、绿题 7 天；连续两次绿或熟练题 14 天后复习。",
};

const defaultMasteryScale: VivaDataset["masteryScale"] = [
  { value: 0, label: "未练", color: "neutral" },
  { value: 1, label: "红｜不会", color: "red" },
  { value: 2, label: "黄｜知道但说乱", color: "amber" },
  { value: 3, label: "绿｜能完整回答", color: "green" },
  { value: 4, label: "熟练｜能接追问", color: "jade" },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function assert(condition: unknown, path: string, message: string): asserts condition {
  if (!condition) throw new Error(`${path}: ${message}`);
}

function requiredString(value: unknown, path: string, maxLength = 20_000): string {
  assert(typeof value === "string" && value.trim().length > 0, path, "必须是非空字符串");
  assert(value.length <= maxLength, path, `不能超过 ${maxLength} 个字符`);
  return value;
}

function optionalString(value: unknown, path: string, fallback = "", maxLength = 20_000): string {
  if (value === undefined || value === null) return fallback;
  assert(typeof value === "string", path, "必须是字符串");
  assert(value.length <= maxLength, path, `不能超过 ${maxLength} 个字符`);
  return value;
}

function stringArray(value: unknown, path: string, fallback: string[] = []): string[] {
  if (value === undefined || value === null) return fallback;
  assert(Array.isArray(value), path, "必须是字符串数组");
  assert(value.length <= 2_000, path, "条目不能超过 2000 个");
  return value.map((item, index) => requiredString(item, `${path}[${index}]`, 20_000));
}

function validateAnswerStructure(value: unknown, path: string): OralAnswerStructure | undefined {
  if (value === undefined || value === null) return undefined;
  assert(isRecord(value), path, "必须是对象");
  assert(Array.isArray(value.points), `${path}.points`, "必须是数组");
  assert(value.points.length >= 2 && value.points.length <= 5, `${path}.points`, "必须包含 2–5 个口述要点");
  return {
    direct: requiredString(value.direct, `${path}.direct`, 2_000),
    points: value.points.map((item, index) => {
      const pointPath = `${path}.points[${index}]`;
      assert(isRecord(item), pointPath, "必须是对象");
      return {
        title: requiredString(item.title, `${pointPath}.title`, 120),
        content: requiredString(item.content, `${pointPath}.content`, 5_000),
      };
    }),
    summary: requiredString(value.summary, `${path}.summary`, 2_000),
  };
}

function validateReviewPolicy(value: unknown): ReviewPolicy {
  if (value === undefined || value === null) return { ...DEFAULT_REVIEW_POLICY };
  assert(isRecord(value), "reviewPolicy", "必须是对象");
  const readDays = (key: keyof Omit<ReviewPolicy, "description">): number => {
    const days = value[key];
    assert(Number.isInteger(days) && Number(days) >= 1 && Number(days) <= 365, `reviewPolicy.${key}`, "必须是 1–365 的整数");
    return Number(days);
  };
  const policy: ReviewPolicy = {
    redDays: readDays("redDays"),
    yellowDays: readDays("yellowDays"),
    greenDays: readDays("greenDays"),
    greenStreak2Days: readDays("greenStreak2Days"),
    description: optionalString(value.description, "reviewPolicy.description"),
  };
  assert(policy.redDays <= policy.yellowDays, "reviewPolicy", "红题周期不能长于黄题周期");
  assert(policy.yellowDays <= policy.greenDays, "reviewPolicy", "黄题周期不能长于绿题周期");
  assert(policy.greenDays <= policy.greenStreak2Days, "reviewPolicy", "长期周期不能短于普通绿题周期");
  return policy;
}

function validateSubjects(value: unknown): Subject[] {
  assert(Array.isArray(value) && value.length > 0, "subjects", "必须至少包含一个科目");
  assert(value.length <= 200, "subjects", "不能超过 200 个科目");
  const subjects = value.map((item, index) => {
    const path = `subjects[${index}]`;
    assert(isRecord(item), path, "必须是对象");
    return {
      id: requiredString(item.id, `${path}.id`, 120),
      name: requiredString(item.name, `${path}.name`, 200),
      order: Number.isFinite(item.order) ? Number(item.order) : index + 1,
    };
  });
  assert(new Set(subjects.map((item) => item.id)).size === subjects.length, "subjects", "id 必须唯一");
  return subjects;
}

function validateSchools(value: unknown): School[] {
  if (value === undefined || value === null) return [];
  assert(Array.isArray(value), "schools", "必须是数组");
  assert(value.length <= 200, "schools", "不能超过 200 所院校");
  const schools = value.map((item, index) => {
    const path = `schools[${index}]`;
    assert(isRecord(item), path, "必须是对象");
    const id = requiredString(item.id, `${path}.id`, 120);
    const name = requiredString(item.name, `${path}.name`, 200);
    const college = optionalString(item.college, `${path}.college`, "未填写学院", 500);
    const direction = optionalString(item.direction, `${path}.direction`, "未填写方向", 1_000);
    const overview = isRecord(item.overview) ? item.overview : {};
    return {
      id,
      name,
      college,
      direction,
      assessmentSummary: optionalString(item.assessmentSummary, `${path}.assessmentSummary`),
      evidenceText: optionalString(item.evidenceText, `${path}.evidenceText`),
      practiceNote: optionalString(item.practiceNote, `${path}.practiceNote`),
      overview: {
        school: optionalString(overview.school, `${path}.overview.school`, name, 200),
        direction: optionalString(overview.direction, `${path}.overview.direction`, `${college} · ${direction}`, 1_000),
        assessmentIntel: optionalString(overview.assessmentIntel, `${path}.overview.assessmentIntel`),
        priorityPrep: optionalString(overview.priorityPrep, `${path}.overview.priorityPrep`, "待补充", 2_000),
        evidenceLevel: optionalString(overview.evidenceLevel, `${path}.overview.evidenceLevel`, "用户自建", 200),
      },
    };
  });
  assert(new Set(schools.map((item) => item.id)).size === schools.length, "schools", "id 必须唯一");
  return schools;
}

function validateQuestion(
  value: unknown,
  index: number,
  subjects: Map<string, Subject>,
  schoolIds: Set<string>,
): VivaQuestion {
  const path = `questions[${index}]`;
  assert(isRecord(value), path, "必须是对象");
  const id = requiredString(value.id, `${path}.id`, 120);
  const subjectId = requiredString(value.subjectId, `${path}.subjectId`, 120);
  assert(subjects.has(subjectId), `${path}.subjectId`, "引用了不存在的科目");
  const schools = stringArray(value.schools, `${path}.schools`);
  schools.forEach((schoolId, schoolIndex) => assert(schoolIds.has(schoolId), `${path}.schools[${schoolIndex}]`, "引用了不存在的院校"));
  const scope = value.scope ?? (schools.length > 0 ? "school" : "general");
  assert(scope === "general" || scope === "school", `${path}.scope`, "必须是 general 或 school");
  assert(scope !== "school" || schools.length > 0, `${path}.schools`, "院校题必须关联至少一所院校");
  const priority = value.priority ?? "A";
  assert(typeof priority === "string" && priorities.has(priority), `${path}.priority`, "必须是 S、A 或 B");
  assert(isRecord(value.answer), `${path}.answer`, "必须是对象");
  const followUps = stringArray(value.followUps, `${path}.followUps`);
  const tags = stringArray(value.tags, `${path}.tags`);
  const source = value.source === undefined ? {} : value.source;
  assert(isRecord(source), `${path}.source`, "必须是对象");
  const sourceType = source.type ?? "user-authored";
  assert(typeof sourceType === "string" && sourceTypes.has(sourceType as SourceType), `${path}.source.type`, "来源类型不受支持");
  assert(sourceType !== "screenshot-verified" || schools.length > 0, `${path}.schools`, "截图真题必须关联院校");
  const mastery = value.mastery ?? 0;
  assert(Number.isInteger(mastery) && Number(mastery) >= 0 && Number(mastery) <= 4, `${path}.mastery`, "必须是 0–4 的整数");
  const practice = isRecord(value.practice) ? value.practice : {};
  const status = practice.status ?? "unseen";
  assert(status === "unseen" || status === "practiced", `${path}.practice.status`, "必须是 unseen 或 practiced");
  const stars = value.stars ?? null;
  assert(stars === null || (Number.isInteger(stars) && Number(stars) >= 0 && Number(stars) <= 10), `${path}.stars`, "必须是 null 或 0–10 的整数");
  return {
    id,
    scope,
    subjectId,
    subject: optionalString(value.subject, `${path}.subject`, subjects.get(subjectId)?.name ?? "", 200),
    priority: priority as VivaQuestion["priority"],
    stars: stars as number | null,
    question: requiredString(value.question, `${path}.question`),
    answer: {
      spoken: requiredString(value.answer.spoken, `${path}.answer.spoken`),
      structure: validateAnswerStructure(value.answer.structure, `${path}.answer.structure`),
      explanation: optionalString(value.answer.explanation, `${path}.answer.explanation`),
      memoryHook: optionalString(value.answer.memoryHook, `${path}.answer.memoryHook`),
    },
    followUps,
    schools,
    source: {
      type: sourceType as SourceType,
      label: optionalString(source.label, `${path}.source.label`, sourceType === "user-authored" ? "用户自建" : "未标注来源", 500),
      reference: optionalString(source.reference, `${path}.source.reference`),
    },
    tags,
    favorite: typeof value.favorite === "boolean" ? value.favorite : false,
    mastery: Number(mastery) as MasteryLevel,
    practice: {
      status,
      lastPracticedAt: practice.lastPracticedAt === null ? null : optionalString(practice.lastPracticedAt, `${path}.practice.lastPracticedAt`, "") || null,
      nextReviewAt: practice.nextReviewAt === null ? null : optionalString(practice.nextReviewAt, `${path}.practice.nextReviewAt`, "") || null,
      streakGreen: Number.isInteger(practice.streakGreen) && Number(practice.streakGreen) >= 0 ? Number(practice.streakGreen) : 0,
    },
  };
}

function validateStudyGuide(value: unknown): VivaDataset["studyGuide"] {
  const guide = isRecord(value) ? value : {};
  const masteryCriteria = isRecord(guide.masteryCriteria)
    ? Object.fromEntries(Object.entries(guide.masteryCriteria).map(([key, item]) => [key, optionalString(item, `studyGuide.masteryCriteria.${key}`)]))
    : {};
  const plan = guide.plan28Days === undefined ? [] : guide.plan28Days;
  assert(Array.isArray(plan), "studyGuide.plan28Days", "必须是数组");
  return {
    masteryCriteria,
    dailyRoutine: optionalString(guide.dailyRoutine, "studyGuide.dailyRoutine", "从今天的推荐题开始闭卷口述。"),
    plan28Days: plan.map((item, index) => {
      assert(isRecord(item), `studyGuide.plan28Days[${index}]`, "必须是对象");
      return {
        day: requiredString(item.day, `studyGuide.plan28Days[${index}].day`, 100),
        theme: requiredString(item.theme, `studyGuide.plan28Days[${index}].theme`, 1_000),
      };
    }),
    finalStandard: optionalString(guide.finalStandard, "studyGuide.finalStandard"),
  };
}

function validateSourceCatalog(value: unknown): VivaDataset["sourceCatalog"] {
  if (value === undefined || value === null) return [];
  assert(Array.isArray(value), "sourceCatalog", "必须是数组");
  return value.map((item, index) => {
    const path = `sourceCatalog[${index}]`;
    assert(isRecord(item), path, "必须是对象");
    const urls = stringArray(item.urls, `${path}.urls`);
    urls.forEach((url, urlIndex) => {
      let protocol = "";
      try { protocol = new URL(url).protocol; } catch { /* handled by the assertion below */ }
      assert(protocol === "https:" || protocol === "http:", `${path}.urls[${urlIndex}]`, "只允许 http/https 链接");
    });
    return {
      category: requiredString(item.category, `${path}.category`, 500),
      text: optionalString(item.text, `${path}.text`),
      urls,
    };
  });
}

function validateReferenceTables(value: unknown): VivaDataset["referenceTables"] {
  const tables = isRecord(value) ? value : {};
  const sorting = tables.sortingAlgorithms === undefined ? [] : tables.sortingAlgorithms;
  assert(Array.isArray(sorting), "referenceTables.sortingAlgorithms", "必须是数组");
  return {
    sortingAlgorithms: sorting.map((row, index) => {
      assert(isRecord(row), `referenceTables.sortingAlgorithms[${index}]`, "必须是对象");
      return Object.fromEntries(Object.entries(row).map(([key, item]) => [key, optionalString(item, `referenceTables.sortingAlgorithms[${index}].${key}`)]));
    }),
  };
}

export function validateDataset(value: unknown): VivaDataset {
  assert(isRecord(value), "dataset", "必须是对象");
  assert(value.schemaVersion === 1, "schemaVersion", "必须等于 1");
  const subjects = validateSubjects(value.subjects);
  const schools = validateSchools(value.schools);
  assert(Array.isArray(value.questions) && value.questions.length > 0, "questions", "必须至少包含一道题");
  assert(value.questions.length <= 5_000, "questions", "不能超过 5000 道题");
  const subjectMap = new Map(subjects.map((item) => [item.id, item]));
  const schoolIds = new Set(schools.map((item) => item.id));
  const questions = value.questions.map((item, index) => validateQuestion(item, index, subjectMap, schoolIds));
  assert(new Set(questions.map((question) => question.id)).size === questions.length, "questions", "id 必须唯一");
  const counts = questions.reduce<VivaDataset["metadata"]["counts"]>((result, question) => {
    result.total += 1;
    result[question.scope] += 1;
    result[question.priority] += 1;
    return result;
  }, { S: 0, A: 0, B: 0, general: 0, school: 0, total: 0 });
  const metadata = isRecord(value.metadata) ? value.metadata : {};
  const masteryScale = value.masteryScale === undefined ? defaultMasteryScale : value.masteryScale;
  assert(Array.isArray(masteryScale), "masteryScale", "必须是数组");
  return {
    schemaVersion: 1,
    app: optionalString(value.app, "app", "Qingyun Viva", 200),
    metadata: {
      name: optionalString(metadata.name, "metadata.name", "我的青云问道题库", 500),
      tagline: optionalString(metadata.tagline, "metadata.tagline", "以问促学，以答验知", 500),
      sourceDocument: optionalString(metadata.sourceDocument, "metadata.sourceDocument"),
      generatedAt: optionalString(metadata.generatedAt, "metadata.generatedAt", new Date().toISOString(), 200),
      counts,
      notes: optionalString(metadata.notes, "metadata.notes"),
    },
    masteryScale: masteryScale.map((item, index) => {
      const path = `masteryScale[${index}]`;
      assert(isRecord(item), path, "必须是对象");
      assert(Number.isInteger(item.value) && Number(item.value) >= 0 && Number(item.value) <= 4, `${path}.value`, "必须是 0–4 的整数");
      return {
        value: Number(item.value) as MasteryLevel,
        label: requiredString(item.label, `${path}.label`, 200),
        color: requiredString(item.color, `${path}.color`, 100),
      };
    }),
    reviewPolicy: validateReviewPolicy(value.reviewPolicy),
    studyGuide: validateStudyGuide(value.studyGuide),
    subjects,
    schools,
    crossSchoolHighFrequency: stringArray(value.crossSchoolHighFrequency, "crossSchoolHighFrequency"),
    referenceTables: validateReferenceTables(value.referenceTables),
    sourceCatalog: validateSourceCatalog(value.sourceCatalog),
    questions,
  };
}

export function validateDefaultDataset(value: unknown): VivaDataset {
  const dataset = validateDataset(value);
  assert(dataset.schools.length === 12, "schools", "默认题库应包含 12 所院校");
  assert(dataset.subjects.length === 14, "subjects", "默认题库应包含 14 个科目");
  assert(dataset.questions.length === 246, "questions", "默认题库应包含 246 道题");
  const counts = dataset.metadata.counts;
  assert(counts.general === 143 && counts.school === 103, "questions.scope", "默认题库分布应为 general=143、school=103");
  assert(counts.S === 133 && counts.A === 71 && counts.B === 42, "questions.priority", "默认题库分布应为 S=133、A=71、B=42");
  assert(dataset.questions.every((question) => question.answer.structure), "questions.answer.structure", "默认题库每道题都应包含结构化口述答案");
  return dataset;
}
