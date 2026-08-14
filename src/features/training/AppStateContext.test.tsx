import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AppStateProvider, useAppState } from "./AppStateContext";

const wrapper = ({ children }: { children: ReactNode }) => <AppStateProvider>{children}</AppStateProvider>;

describe("AppStateContext", () => {
  beforeEach(() => localStorage.clear());

  it("writes a formal practice record and updates review scheduling", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    act(() => result.current.recordPractice({ questionId: "q-1", mastery: 1, followUpsAttempted: 1, followUpsPassed: 0, durationSeconds: 61, mode: "daily" }, new Date("2026-08-14T08:00:00.000Z")));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.progress["q-1"]).toMatchObject({ mastery: 1, totalPractices: 1, lastFollowUpResult: "stuck", nextReviewAt: "2026-08-15T08:00:00.000Z" });
    expect(JSON.parse(localStorage.getItem("qingyun-viva:history:v1") ?? "[]")).toHaveLength(1);
  });

  it("moves two consecutive green results to a 14-day interval", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    const submission = { questionId: "q-2", mastery: 3 as const, followUpsAttempted: 0, followUpsPassed: 0, durationSeconds: 45, mode: "review" as const };
    act(() => result.current.recordPractice(submission, new Date("2026-08-14T08:00:00.000Z")));
    act(() => result.current.recordPractice(submission, new Date("2026-08-15T08:00:00.000Z")));
    expect(result.current.progress["q-2"].greenStreak).toBe(2);
    expect(result.current.progress["q-2"].nextReviewAt).toBe("2026-08-29T08:00:00.000Z");
  });

  it("exports and restores a versioned backup", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    act(() => result.current.toggleFavorite("q-3"));
    const backup = result.current.exportBackup();
    expect(backup).toMatchObject({ app: "qingyun-viva", schemaVersion: 1 });
    act(() => result.current.clearTrainingHistory());
    expect(result.current.progress).toEqual({});
    act(() => result.current.importBackup(backup));
    expect(result.current.progress["q-3"].favorite).toBe(true);
    expect(() => result.current.importBackup({ schemaVersion: 99 })).toThrow(/format|version|版本/);
  });
});
