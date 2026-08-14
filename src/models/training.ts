import type { MasteryLevel } from "./dataset";

export type PracticeMode = "daily" | "question-bank" | "review" | "school" | "mock";
export type FollowUpResult = "passed" | "stuck" | "not-attempted";

export interface QuestionProgress {
  questionId: string;
  mastery: MasteryLevel;
  favorite: boolean;
  totalPractices: number;
  lastPracticedAt?: string;
  nextReviewAt?: string;
  greenStreak: number;
  lastFollowUpResult?: FollowUpResult;
}

export interface PracticeRecord {
  id: string;
  questionId: string;
  practicedAt: string;
  mastery: MasteryLevel;
  followUpsAttempted: number;
  followUpsPassed: number;
  durationSeconds: number;
  mode: PracticeMode;
  schoolId?: string;
}

export interface UserSettings {
  currentSchoolId: string | null;
  dailyGoal: number;
  timerSeconds: 45 | 60 | 90;
}

export interface PersistedState {
  schemaVersion: 1;
  progress: Record<string, QuestionProgress>;
  history: PracticeRecord[];
  settings: UserSettings;
}

export interface BackupPayload extends PersistedState {
  app: "qingyun-viva";
  exportedAt: string;
}

export interface PracticeSubmission {
  questionId: string;
  mastery: MasteryLevel;
  followUpsAttempted: number;
  followUpsPassed: number;
  durationSeconds: number;
  mode: PracticeMode;
  schoolId?: string;
}
