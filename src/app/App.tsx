import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { DashboardPage } from "../pages/DashboardPage";
import { MockPage } from "../pages/MockPage";
import { MockReportPage } from "../pages/MockReportPage";
import { MockSessionPage } from "../pages/MockSessionPage";
import { QuestionPage } from "../pages/QuestionPage";
import { QuestionsPage } from "../pages/QuestionsPage";
import { ReviewPage } from "../pages/ReviewPage";
import { SchoolDetailPage } from "../pages/SchoolDetailPage";
import { SchoolsPage } from "../pages/SchoolsPage";
import { SettingsPage } from "../pages/SettingsPage";

function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const section = pathname.startsWith("/question/") ? "闭卷口述"
      : pathname.startsWith("/questions") ? "专业课题库"
      : pathname.startsWith("/schools/") ? "院校研习案"
      : pathname.startsWith("/schools") ? "目标院校"
      : pathname.startsWith("/mock/session") ? "模拟口试进行中"
      : pathname.startsWith("/mock/report") ? "模拟面试复盘"
      : pathname.startsWith("/mock") ? "模拟面试"
      : pathname.startsWith("/review") ? "复习簿"
      : pathname.startsWith("/settings") ? "设置与数据"
      : "今日研习";
    document.title = `${section} · 青云问道`;
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <><PageTitle /><Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="question/:questionId" element={<QuestionPage />} />
        <Route path="schools" element={<SchoolsPage />} />
        <Route path="schools/:schoolId" element={<SchoolDetailPage />} />
        <Route path="mock" element={<MockPage />} />
        <Route path="mock/session/:sessionId" element={<MockSessionPage />} />
        <Route path="mock/report/:sessionId" element={<MockReportPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes></>
  );
}
