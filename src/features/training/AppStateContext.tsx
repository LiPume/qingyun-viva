import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MasteryLevel, ReviewPolicy } from "../../models/dataset";
import type {
  BackupPayload,
  PersistedState,
  PracticeRecord,
  PracticeSubmission,
  QuestionProgress,
  UserSettings,
} from "../../models/training";
import { getNextReviewAt } from "../../lib/training";
import { useDataset } from "../dataset/DatasetContext";
import { DEFAULT_REVIEW_POLICY } from "../dataset/validate";

const PROGRESS_KEY = "qingyun-viva:progress:v1";
const HISTORY_KEY = "qingyun-viva:history:v1";
const SETTINGS_KEY = "qingyun-viva:settings:v1";

const defaultSettings: UserSettings = { currentSchoolId: null, dailyGoal: 8, timerSeconds: 60 };

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function initialState(): PersistedState {
  return {
    schemaVersion: 1,
    progress: readJson<Record<string, QuestionProgress>>(PROGRESS_KEY, {}),
    history: readJson<PracticeRecord[]>(HISTORY_KEY, []),
    settings: { ...defaultSettings, ...readJson<Partial<UserSettings>>(SETTINGS_KEY, {}) },
  };
}

function persist(state: PersistedState): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

interface AppStateContextValue extends PersistedState {
  recordPractice: (submission: PracticeSubmission, practicedAt?: Date) => void;
  toggleFavorite: (questionId: string) => void;
  setCurrentSchool: (schoolId: string | null) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  exportBackup: () => BackupPayload;
  importBackup: (value: unknown) => void;
  recalculateReviewSchedule: (policy: ReviewPolicy) => void;
  clearTrainingHistory: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

const newId = (): string => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function validateBackup(value: unknown): BackupPayload {
  if (!value || typeof value !== "object") throw new Error("备份文件不是有效对象。");
  const backup = value as Partial<BackupPayload>;
  if (backup.app !== "qingyun-viva" || backup.schemaVersion !== 1) throw new Error("不支持的备份格式或版本。");
  if (!backup.progress || typeof backup.progress !== "object" || !Array.isArray(backup.history) || !backup.settings) {
    throw new Error("备份缺少 progress、history 或 settings。");
  }
  return backup as BackupPayload;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(initialState);
  const { dataset } = useDataset();
  const reviewPolicy = dataset?.reviewPolicy ?? DEFAULT_REVIEW_POLICY;

  const update = (updater: (current: PersistedState) => PersistedState) => {
    setState((current) => {
      const next = updater(current);
      persist(next);
      return next;
    });
  };

  useEffect(() => {
    const currentSchoolId = state.settings.currentSchoolId;
    if (dataset && currentSchoolId && !dataset.schools.some((school) => school.id === currentSchoolId)) {
      const timeout = window.setTimeout(() => {
        setState((current) => {
          if (current.settings.currentSchoolId !== currentSchoolId) return current;
          const next = { ...current, settings: { ...current.settings, currentSchoolId: null } };
          persist(next);
          return next;
        });
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [dataset, state.settings.currentSchoolId]);

  const value = useMemo<AppStateContextValue>(() => ({
    ...state,
    recordPractice: (submission, practicedAt = new Date()) => update((current) => {
      const previous = current.progress[submission.questionId];
      const greenStreak = submission.mastery >= 3 ? (previous?.greenStreak ?? 0) + 1 : 0;
      const timestamp = practicedAt.toISOString();
      const nextProgress: QuestionProgress = {
        questionId: submission.questionId,
        mastery: submission.mastery,
        favorite: previous?.favorite ?? false,
        totalPractices: (previous?.totalPractices ?? 0) + 1,
        lastPracticedAt: timestamp,
        nextReviewAt: getNextReviewAt(submission.mastery, greenStreak, practicedAt, reviewPolicy),
        greenStreak,
        lastFollowUpResult: submission.followUpsAttempted === 0
          ? "not-attempted"
          : submission.followUpsPassed === submission.followUpsAttempted ? "passed" : "stuck",
      };
      const record: PracticeRecord = {
        id: newId(),
        questionId: submission.questionId,
        practicedAt: timestamp,
        mastery: submission.mastery,
        followUpsAttempted: submission.followUpsAttempted,
        followUpsPassed: submission.followUpsPassed,
        durationSeconds: submission.durationSeconds,
        mode: submission.mode,
        ...(submission.schoolId ? { schoolId: submission.schoolId } : {}),
      };
      return {
        ...current,
        progress: { ...current.progress, [submission.questionId]: nextProgress },
        history: [...current.history, record],
      };
    }),
    toggleFavorite: (questionId) => update((current) => {
      const previous = current.progress[questionId];
      return {
        ...current,
        progress: {
          ...current.progress,
          [questionId]: {
            questionId,
            mastery: (previous?.mastery ?? 0) as MasteryLevel,
            favorite: !previous?.favorite,
            totalPractices: previous?.totalPractices ?? 0,
            greenStreak: previous?.greenStreak ?? 0,
            ...(previous?.lastPracticedAt ? { lastPracticedAt: previous.lastPracticedAt } : {}),
            ...(previous?.nextReviewAt ? { nextReviewAt: previous.nextReviewAt } : {}),
            ...(previous?.lastFollowUpResult ? { lastFollowUpResult: previous.lastFollowUpResult } : {}),
          },
        },
      };
    }),
    setCurrentSchool: (schoolId) => update((current) => ({
      ...current,
      settings: { ...current.settings, currentSchoolId: schoolId },
    })),
    updateSettings: (patch) => update((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
    })),
    exportBackup: () => ({
      app: "qingyun-viva",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      progress: state.progress,
      history: state.history,
      settings: state.settings,
    }),
    importBackup: (raw) => {
      const backup = validateBackup(raw);
      const next: PersistedState = {
        schemaVersion: 1,
        progress: backup.progress,
        history: backup.history,
        settings: { ...defaultSettings, ...backup.settings },
      };
      persist(next);
      setState(next);
    },
    recalculateReviewSchedule: (policy) => update((current) => ({
      ...current,
      progress: Object.fromEntries(Object.entries(current.progress).map(([questionId, item]) => {
        if (!item.lastPracticedAt || item.mastery === 0) {
          const rest = { ...item };
          delete rest.nextReviewAt;
          return [questionId, rest];
        }
        return [questionId, {
          ...item,
          nextReviewAt: getNextReviewAt(item.mastery, item.greenStreak, new Date(item.lastPracticedAt), policy),
        }];
      })),
    })),
    clearTrainingHistory: () => update((current) => ({ ...current, progress: {}, history: [] })),
  }), [reviewPolicy, state]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
