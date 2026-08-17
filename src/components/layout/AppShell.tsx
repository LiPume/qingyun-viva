import { BookMarked, Building2, CalendarCheck2, LibraryBig, MessageCircleQuestion, Settings, type LucideIcon } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useDataset } from "../../features/dataset/DatasetContext";
import { useAppState } from "../../features/training/AppStateContext";

interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  mobile?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "今日研习", shortLabel: "今日", icon: CalendarCheck2, mobile: true },
  { to: "/questions", label: "题库", shortLabel: "题库", icon: LibraryBig, mobile: true },
  { to: "/schools", label: "院校", shortLabel: "院校", icon: Building2, mobile: true },
  { to: "/mock", label: "模拟面试", shortLabel: "模拟", icon: MessageCircleQuestion, mobile: true },
  { to: "/review", label: "复习簿", shortLabel: "复习", icon: BookMarked, mobile: true },
  { to: "/settings", label: "设置", shortLabel: "设置", icon: Settings },
];

export function AppShell() {
  const { dataset, loading, error, warning, reload } = useDataset();
  const { settings } = useAppState();
  const location = useLocation();
  const focused = location.pathname.startsWith("/mock/session");
  const school = dataset?.schools.find((item) => item.id === settings.currentSchoolId);

  if (loading) return <main className="fatal-state" aria-busy="true"><div className="brand-mark">问</div><h1>正在整理今日题笺……</h1></main>;
  if (error || !dataset) return (
    <main className="fatal-state" role="alert">
      <div className="brand-mark">问</div>
      <h1>题库未能完整载入</h1>
      <p>{error ?? "未知数据错误"}</p>
      <button className="button primary" onClick={reload}>重新校验题库</button>
    </main>
  );

  if (focused) return <main className="focus-shell"><Outlet /></main>;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主内容</a>
      <aside className="sidebar" aria-label="主导航">
        <NavLink to="/" className="brand" aria-label="青云问道首页">
          <span className="brand-mark" aria-hidden="true">问</span>
          <span><strong>青云问道</strong><small translate="no">Qingyun Viva</small></span>
        </NavLink>
        <nav className="desktop-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => isActive ? "active" : ""}>
              <Icon aria-hidden="true" size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="school-context">
          <span>当前院校</span>
          <strong>{school?.name ?? "全科模式"}</strong>
        </div>
        <p className="sidebar-motto">以问促学，以答验知。</p>
      </aside>
      <header className="mobile-header">
        <NavLink to="/" className="brand"><span className="brand-mark" aria-hidden="true">问</span><strong>青云问道</strong></NavLink>
        <NavLink to="/settings" className="icon-button" aria-label="打开设置"><Settings size={20} /></NavLink>
      </header>
      <main id="main-content" className="main-content">{warning && <div className="dataset-warning" role="status">{warning}</div>}<Outlet /></main>
      <nav className="mobile-nav" aria-label="移动端主导航">
        {navItems.filter((item) => item.mobile).map(({ to, shortLabel, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => isActive ? "active" : ""}>
            <Icon aria-hidden="true" size={20} /><span>{shortLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
