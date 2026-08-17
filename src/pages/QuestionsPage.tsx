import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { QuestionRow } from "../components/QuestionRow";
import { useDataset } from "../features/dataset/DatasetContext";
import { useAppState } from "../features/training/AppStateContext";
import { filterQuestions, type QuestionFilters } from "../lib/filters";

const paramMap: Record<keyof QuestionFilters, string> = {
  query: "q",
  subjectId: "subject",
  priority: "priority",
  schoolId: "school",
  sourceType: "source",
  practice: "practice",
  mastery: "mastery",
  favorite: "favorite",
  highFrequency: "frequent",
  targetSchoolsOnly: "schoolsOnly",
};

function readFilters(params: URLSearchParams): QuestionFilters {
  return {
    query: params.get("q") ?? "",
    subjectId: params.get("subject") ?? "",
    priority: params.get("priority") ?? "",
    schoolId: params.get("school") ?? "",
    sourceType: params.get("source") ?? "",
    practice: params.get("practice") ?? "",
    mastery: params.get("mastery") ?? "",
    favorite: params.get("favorite") === "1",
    highFrequency: params.get("frequent") === "1",
    targetSchoolsOnly: params.get("schoolsOnly") === "1",
  };
}

export function QuestionsPage() {
  const { dataset } = useDataset();
  const { progress, toggleFavorite } = useAppState();
  const [params, setParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const filters = readFilters(params);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(
    () => dataset ? filterQuestions(dataset, progress, filters) : [],
    [dataset, filters, progress],
  );
  if (!dataset) return null;

  const updateFilter = <K extends keyof QuestionFilters>(key: K, value: QuestionFilters[K]) => {
    const next = new URLSearchParams(params);
    const param = paramMap[key];
    if (typeof value === "boolean") {
      if (value) next.set(param, "1"); else next.delete(param);
    } else if (value) next.set(param, value); else next.delete(param);
    setParams(next, { replace: true });
  };
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== "query" && Boolean(value)).length;
  const sourceOptions = [...new Map(dataset.questions.map((question) => [question.source.type, question.source.label])).entries()];

  return (
    <div className="page questions-page">
      <header className="page-header">
        <div><p className="eyebrow">{dataset.questions.length} oral prompts</p><h1>专业课题库</h1><p>不是翻阅手册，而是一张张开口的题签。</p></div>
        <div className="result-count"><strong>{results.length}</strong><span>/ {dataset.questions.length} 题</span></div>
      </header>

      <div className="search-bar">
        <Search aria-hidden="true" size={20} />
        <label className="sr-only" htmlFor="question-search">搜索题目、答案或知识点</label>
        <input
          ref={searchRef}
          id="question-search"
          name="question-search"
          type="search"
          autoComplete="off"
          value={filters.query}
          onChange={(event) => updateFilter("query", event.target.value)}
          placeholder="搜索题目、答案、知识点……"
        />
        <kbd>/</kbd>
      </div>

      <div className="question-browser">
        <details className="filter-panel" open>
          <summary><SlidersHorizontal aria-hidden="true" size={18} />筛选题签 {activeCount > 0 && <span>{activeCount}</span>}</summary>
          <div className="filter-content">
            <label>科目<select value={filters.subjectId} onChange={(event) => updateFilter("subjectId", event.target.value)}><option value="">全部科目</option>{dataset.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
            <label>优先级<select value={filters.priority} onChange={(event) => updateFilter("priority", event.target.value)}><option value="">全部级别</option><option value="S">S 级</option><option value="A">A 级</option><option value="B">B 级</option></select></label>
            <label>目标院校<select value={filters.schoolId} onChange={(event) => updateFilter("schoolId", event.target.value)}><option value="">全部院校</option>{dataset.schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>
            <label>证据类型<select value={filters.sourceType} onChange={(event) => updateFilter("sourceType", event.target.value)}><option value="">全部来源</option>{sourceOptions.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select></label>
            <label>练习状态<select value={filters.practice} onChange={(event) => updateFilter("practice", event.target.value)}><option value="">全部状态</option><option value="unseen">从未练习</option><option value="practiced">已正式练习</option><option value="today">今日练过</option><option value="due">已到期</option></select></label>
            <label>掌握程度<select value={filters.mastery} onChange={(event) => updateFilter("mastery", event.target.value)}><option value="">全部程度</option><option value="0">未练</option><option value="1">红 · 不会</option><option value="2">黄 · 说乱</option><option value="3">绿 · 完整</option><option value="4">熟练 · 能追问</option></select></label>
            <div className="check-filters">
              <label><input type="checkbox" checked={filters.favorite} onChange={(event) => updateFilter("favorite", event.target.checked)} /> 只看收藏</label>
              <label><input type="checkbox" checked={filters.highFrequency} onChange={(event) => updateFilter("highFrequency", event.target.checked)} /> 跨校高频</label>
              <label><input type="checkbox" checked={filters.targetSchoolsOnly} onChange={(event) => updateFilter("targetSchoolsOnly", event.target.checked)} /> 只看院校题</label>
            </div>
            {activeCount > 0 && <button className="text-button" onClick={() => setParams(filters.query ? { q: filters.query } : {})}><X size={16} />清除筛选</button>}
          </div>
        </details>
        <section className="question-results" aria-label="题库搜索结果">
          <div className="results-toolbar"><span><Filter size={16} aria-hidden="true" />当前显示 {results.length} 题</span><span>点击题目开始闭卷口述</span></div>
          {results.length ? <div className="question-list">{results.map((question) => <QuestionRow key={question.id} question={question} progress={progress[question.id]} onToggleFavorite={toggleFavorite} />)}</div> : (
            <div className="empty-state"><Search size={28} aria-hidden="true" /><h2>没有匹配的题签</h2><p>试试减少筛选条件，或换一个答案关键词。</p><button className="button secondary" onClick={() => setParams({})}>查看全部题目</button></div>
          )}
        </section>
      </div>
    </div>
  );
}
