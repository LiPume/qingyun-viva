export type Priority = "S" | "A" | "B";
export type MasteryLevel = 0 | 1 | 2 | 3 | 4;
export type QuestionScope = "general" | "school";

export type SourceType =
  | "source-document"
  | "web-supplement"
  | "screenshot-verified"
  | "same-school-experience"
  | "official-scope"
  | "official-direction"
  | "official-current"
  | "official-ai-scope"
  | "official-style-reference"
  | "predicted-high-probability"
  | "school-specific"
  | "user-authored";

export interface ReviewPolicy {
  redDays: number;
  yellowDays: number;
  greenDays: number;
  greenStreak2Days: number;
  description: string;
}

export interface VivaQuestion {
  id: string;
  scope: QuestionScope;
  subjectId: string;
  subject: string;
  priority: Priority;
  stars: number | null;
  question: string;
  answer: {
    spoken: string;
    explanation: string;
    memoryHook: string;
  };
  followUps: string[];
  schools: string[];
  source: {
    type: SourceType;
    label: string;
    reference: string;
  };
  tags: string[];
  favorite: boolean;
  mastery: MasteryLevel;
  practice: {
    status: "unseen" | "practiced";
    lastPracticedAt: string | null;
    nextReviewAt: string | null;
    streakGreen: number;
  };
}

export interface Subject {
  id: string;
  name: string;
  order: number;
}

export interface School {
  id: string;
  name: string;
  college: string;
  direction: string;
  assessmentSummary: string;
  evidenceText: string;
  practiceNote: string;
  overview: {
    school: string;
    direction: string;
    assessmentIntel: string;
    priorityPrep: string;
    evidenceLevel: string;
  };
}

export interface VivaDataset {
  schemaVersion: 1;
  app: string;
  metadata: {
    name: string;
    tagline: string;
    sourceDocument: string;
    generatedAt: string;
    counts: Record<"S" | "A" | "B" | "general" | "school" | "total", number>;
    notes: string;
  };
  masteryScale: Array<{ value: MasteryLevel; label: string; color: string }>;
  reviewPolicy: ReviewPolicy;
  studyGuide: {
    masteryCriteria: Record<string, string>;
    dailyRoutine: string;
    plan28Days: Array<{ day: string; theme: string }>;
    finalStandard: string;
  };
  subjects: Subject[];
  schools: School[];
  crossSchoolHighFrequency: string[];
  referenceTables: {
    sortingAlgorithms: Array<Record<string, string>>;
  };
  sourceCatalog: Array<{ category: string; text: string; urls: string[] }>;
  questions: VivaQuestion[];
}
