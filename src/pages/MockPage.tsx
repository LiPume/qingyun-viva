import { ArrowRight, Clock3, Focus, ListChecks, School, Shuffle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataset } from "../features/dataset/DatasetContext";
import { selectMockQuestions, type MockConfig } from "../features/mock/engine";
import { useAppState } from "../features/training/AppStateContext";

export interface StoredMockSession {
  schemaVersion: 1;
  id: string;
  config: MockConfig;
  questionIds: string[];
  followUps: Record<string, string>;
  ratings: Record<string, 1 | 2 | 3 | 4>;
  currentIndex: number;
  startedAt: string;
  completedAt?: string;
  committed: boolean;
}

export const mockSessionKey = (id: string) => `qingyun-viva:mock:session:${id}`;

export function MockPage() {
  const { dataset } = useDataset();
  const { settings } = useAppState();
  const navigate = useNavigate();
  const [config, setConfig] = useState<MockConfig>({ durationMinutes: 10, count: 5, subjectId: "", schoolId: settings.currentSchoolId ?? "", priorityMode: "SA", includeProjects: true });
  if (!dataset) return null;

  const start = () => {
    const questions = selectMockQuestions(dataset, config);
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const followUps = Object.fromEntries(questions.flatMap((question, index) => question.followUps.length && index % 2 === 1 ? [[question.id, question.followUps[0]]] : []));
    const session: StoredMockSession = { schemaVersion: 1, id, config, questionIds: questions.map((question) => question.id), followUps, ratings: {}, currentIndex: 0, startedAt: new Date().toISOString(), committed: false };
    sessionStorage.setItem(mockSessionKey(id), JSON.stringify(session));
    navigate(`/mock/session/${id}`);
  };

  return (
    <div className="page mock-page">
      <header className="mock-hero cloud-divider"><div><p className="eyebrow">Full viva rehearsal</p><h1>进入真实面试节奏</h1><p>不看答案、不回退改分。用一段连续口述，找出最先断掉的知识链。</p></div><div className="focus-emblem" aria-hidden="true"><Focus /><span>VIVA</span></div></header>
      <div className="mock-builder">
        <section className="mock-form" aria-labelledby="mock-config-heading"><p className="eyebrow">Session setup</p><h2 id="mock-config-heading">设置本场口试</h2>
          <fieldset><legend><Clock3 size={18} />面试时长</legend><div className="choice-row">{([10, 15, 20] as const).map((value) => <label key={value}><input type="radio" name="minutes" checked={config.durationMinutes === value} onChange={() => setConfig({ ...config, durationMinutes: value })} /><span><strong>{value}</strong>分钟</span></label>)}</div></fieldset>
          <fieldset><legend><ListChecks size={18} />题目数量</legend><div className="choice-row">{([5, 10, 15, 20] as const).map((value) => <label key={value}><input type="radio" name="count" checked={config.count === value} onChange={() => setConfig({ ...config, count: value })} /><span><strong>{value}</strong>题</span></label>)}</div></fieldset>
          <div className="form-grid"><label>科目范围<select value={config.subjectId} onChange={(event) => setConfig({ ...config, subjectId: event.target.value })}><option value="">全科轮转</option>{dataset.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label><label>院校范围<select value={config.schoolId} onChange={(event) => setConfig({ ...config, schoolId: event.target.value })}><option value="">不指定院校</option>{dataset.schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label><label>优先级<select value={config.priorityMode} onChange={(event) => setConfig({ ...config, priorityMode: event.target.value as "S" | "SA" })}><option value="SA">S + A</option><option value="S">仅 S 级</option></select></label><label className="toggle-label"><input type="checkbox" checked={config.includeProjects} onChange={(event) => setConfig({ ...config, includeProjects: event.target.checked })} /><span />包含项目追问</label></div>
          <button className="button primary large" onClick={start}><Shuffle size={20} />生成本场面试 <ArrowRight size={18} /></button>
        </section>
        <aside className="mock-rules"><p className="eyebrow">Interview rules</p><h2>专注模式约定</h2><ol><li><span>01</span><p>进入后隐藏导航和所有答案。</p></li><li><span>02</span><p>题目尽量轮换科目，项目题不超过 30%。</p></li><li><span>03</span><p>评分后只能前进，结束时统一写入历史。</p></li><li><span>04</span><p>复盘首先展示需要回炉的题。</p></li></ol><div className="mock-context"><School size={18} /><span>{config.schoolId ? dataset.schools.find((school) => school.id === config.schoolId)?.name : "全校通用模式"}</span></div></aside>
      </div>
    </div>
  );
}
