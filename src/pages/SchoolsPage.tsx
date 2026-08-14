import { ArrowRight, CheckCircle2, Crosshair } from "lucide-react";
import { Link } from "react-router-dom";
import { useDataset } from "../features/dataset/DatasetContext";
import { useAppState } from "../features/training/AppStateContext";

export function SchoolsPage() {
  const { dataset } = useDataset();
  const { progress, settings, setCurrentSchool } = useAppState();
  if (!dataset) return null;

  return (
    <div className="page schools-page">
      <header className="page-header cloud-divider">
        <div><p className="eyebrow">12 target schools</p><h1>院校研习案</h1><p>真题、官方范围、同校面经与预测始终分层展示。</p></div>
        <aside className="evidence-legend" aria-label="证据分层说明"><span><i className="verified" />截图真题</span><span><i className="official" />官方范围</span><span><i className="experience" />同校面经</span><span><i className="predicted" />高概率预测</span></aside>
      </header>
      <div className="school-grid">
        {dataset.schools.map((school, index) => {
          const questions = dataset.questions.filter((question) => question.schools.includes(school.id));
          const practiced = questions.filter((question) => progress[question.id]?.totalPractices).length;
          const mastered = questions.filter((question) => (progress[question.id]?.mastery ?? 0) >= 3).length;
          const priorities = { S: questions.filter((question) => question.priority === "S").length, A: questions.filter((question) => question.priority === "A").length, B: questions.filter((question) => question.priority === "B").length };
          const active = settings.currentSchoolId === school.id;
          return (
            <article className={`school-card ${active ? "active" : ""}`} key={school.id}>
              <header><span className="school-number">{String(index + 1).padStart(2, "0")}</span>{active && <span className="current-seal"><CheckCircle2 size={14} />当前模式</span>}</header>
              <p className="school-college">{school.college}</p>
              <h2><Link to={`/schools/${school.id}`}>{school.name}</Link></h2>
              <p className="school-direction">{school.direction}</p>
              <div className="school-evidence"><span>可核验层级</span><strong>{school.overview.evidenceLevel}</strong></div>
              <p className="school-focus"><span>优先备考</span>{school.overview.priorityPrep}</p>
              <div className="school-stats"><span><strong>{questions.length}</strong>题</span><span>S {priorities.S} / A {priorities.A} / B {priorities.B}</span><span><strong>{mastered}</strong>掌握</span></div>
              <div className="coverage-track"><span style={{ width: `${questions.length ? (practiced / questions.length) * 100 : 0}%` }} /></div>
              <footer><button className="text-button" onClick={() => setCurrentSchool(active ? null : school.id)}><Crosshair size={16} />{active ? "退出该校模式" : "设为当前模式"}</button><Link to={`/schools/${school.id}`} aria-label={`查看 ${school.name} 详情`}><ArrowRight size={18} /></Link></footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
