# 青云问道 · Qingyun Viva — 设计与技术方案

## 1. 设计原则

青云问道应与“青云研语”属于同一产品家族，但不能只是换文字和配色。

青云研语解决“英语表达训练”；青云问道解决“专业知识的主动回忆与口述”。因此新的视觉重心应从“语言卡片”转向“研习桌 / 题签 / 讲义索引 / 面试现场”。

核心体验原则：

1. **问题优先**：训练页第一屏只让用户看到问题，而不是答案。
2. **逐层揭示**：口述答案 → 知识解析 → 追问 → 来源，避免一次性信息爆炸。
3. **行动优先于统计**：任何统计都要能指向“现在练什么”。
4. **证据可见**：真题 / 官方 / 预测必须一眼区分。
5. **克制而有辨识度**：有东方书卷气，但不是仿古网页。

## 2. 视觉方向

### 2.1 关键词

`ink / paper / jade / cloud / index card / editorial / academic`

### 2.2 推荐色板

```css
:root {
  --paper: #f8f6ef;
  --paper-strong: #fffdf7;
  --ink: #17222d;
  --ink-soft: #52606d;
  --line: #d9ddd8;
  --mist: #e9eeeb;
  --jade: #2f6b62;
  --jade-deep: #204f49;
  --gold: #b78a3d;
  --cinnabar: #a94f3d;
  --amber: #a66d22;
  --green: #3f7458;
}
```

不要采用大面积紫蓝渐变。可以在首页 hero / section divider 使用非常轻的“云气 / 山形”CSS 抽象纹理，但必须克制。

### 2.3 字体

不要默认使用 Inter / Arial 作为主视觉字体。

优先使用系统可用字体，不依赖外部 CDN：

```css
--font-display: "Songti SC", "STSong", "Noto Serif CJK SC", serif;
--font-body: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
--font-mono: "SFMono-Regular", "Cascadia Code", "JetBrains Mono", monospace;
```

- 产品名、章节大标题：宋体 / serif，有书卷感；
- 正文、按钮、数据：现代 sans；
- 计时器 / 复杂度 / 公式：等宽字体可局部使用。

### 2.4 圆角与阴影

避免“每个东西都 16px 大圆角 + shadow”。

建议：

- 页面主面板：6~10px；
- 小标签：999px pill 可以使用，但只用于状态；
- 卡片主要依赖边框、层次和留白，而不是厚阴影；
- hover 用 1~2px 位移 / 边框颜色 / 微小 shadow，不做浮夸缩放。

## 3. 页面结构

## 3.1 App Shell

桌面：左侧窄导航 + 主内容区。  
移动端：顶部品牌栏 + 底部 5 项主导航（今日 / 题库 / 院校 / 模拟 / 复习）。设置放右上角菜单。

左侧导航顶部：

- 小型“云 / 问”品牌符号；
- `青云问道`；
- 英文小字 `Qingyun Viva`。

当前院校模式作为 App Shell 的小型 context badge 展示，但不要常驻大面积占屏。

## 3.2 今日研习

布局建议：

1. 顶部不是营销 hero，而是“今天该做什么”的 editorial header；
2. 左侧/上方：今日计划与一键开始；
3. 中部：推荐题队列；
4. 右侧/下方：到期复习、S级覆盖、连续天数；
5. 底部：各科目“小型书脊式”进度条。

关键 CTA：`开始今日口述`。

推荐题卡不要显示答案，只显示：

- 题目；
- S/A/B；
- 科目；
- 来源证据；
- 为什么今天推荐（如“红题到期”“复旦截图真题”“从未练过的S题”）。

## 3.3 题库

桌面使用“左侧筛选 + 右侧列表”；移动端筛选变 bottom sheet。

列表不做无限卡片瀑布流，建议做高密度 editorial list：

- 行首小型 priority marker；
- 主问题；
- 次行标签；
- 最右 mastery / due；
- hover 展示快捷收藏与开始训练。

搜索框支持 `/` 快捷键聚焦。

筛选 chips 数量过多时必须收纳，不要整页 pill 海洋。

## 3.4 单题训练页

这是设计重点。

### 状态 A：未揭示

页面视觉像一张“口试题签”：

- 顶部 breadcrumb；
- 小型证据标签；
- 大号问题；
- 计时环 / 横向 timer；
- `开始作答`；
- 可选 45 / 60 / 90 秒；
- 页面下半部保持留白，避免答案泄露。

### 状态 B：作答中

- timer 成为视觉中心；
- `我答完了`；
- `暂停` 不应太显眼；
- 即使倒计时到 0 也不自动切走，让用户完成一句话。

### 状态 C：答案揭示

按可折叠 / progressive reveal：

1. **口述版**：最突出；
2. **知识点解析**：纸张底色 panel；
3. **记忆钩子**：一行小注；
4. **追问**：一次一个；
5. **来源**：最底部低视觉权重。

### 状态 D：自评

四个按钮不要只靠颜色：

- 红：不会
- 黄：知道但说乱
- 绿：能完整回答
- 熟练：能接追问

按钮同时有图标 / 文本。键盘支持 `1/2/3/4`。

## 3.5 院校页

学校卡片避免“logo 墙”。用排版建立层级：

- 学校名；
- 学院与方向；
- 当前证据等级；
- 题量；
- S 题覆盖；
- 一句当前备考重点。

学校详情顶部应明显显示：

- 当前可核验考情；
- “此信息检索截止 2026-08-14”；
- 真题 / 官方 / 预测数量分布。

复旦等存在截图真题的院校，应使用“已核验真题”视觉章，但不能做成夸张促销 badge。

## 3.6 模拟面试

进入后切换“专注模式”：

- 隐藏正常导航；
- 仅保留进度、timer、当前题；
- 背景更纯净；
- 切题过渡使用短促 fade/slide；
- 尊重 reduced motion。

报告页优先展示“需要回炉的题”，而不是炫酷图表。

## 3.7 复习簿

采用四个 tab：

- 到期；
- 红黄题；
- 追问卡壳；
- 收藏。

每个 tab 都支持“一键开始这一组”。

## 4. 动效

只在有意义处使用：

- 页面首次进入：标题和主卡片 120~220ms stagger；
- 展开答案：height + opacity；
- 自评成功：轻量状态切换，不撒花；
- timer 最后 10 秒可轻微改变强调度，不闪烁；
- 切换追问：短 slide；
- `prefers-reduced-motion: reduce` 时关闭位移型动画。

不要使用：浮动粒子、持续运动背景、过多 spring bounce。

## 5. 技术栈

建议延续青云研语经过验证的轻量前端架构：

- React 19
- TypeScript
- Vite
- React Router 7
- Tailwind CSS 4 或同等轻量 CSS 方案
- lucide-react
- Vitest
- Testing Library
- Playwright
- GitHub Pages

不引入后端，不引入数据库，不引入账号 SDK。

## 6. 路由

使用 `HashRouter`，适配 GitHub Pages：

```text
/#/
/#/questions
/#/question/:questionId
/#/schools
/#/schools/:schoolId
/#/mock
/#/mock/session/:sessionId
/#/review
/#/settings
```

## 7. 推荐源码结构

```text
qingyun-viva/
├─ docs/
│  ├─ PRD.md
│  ├─ DESIGN.md
│  ├─ CODEX_LOOP_PROMPT.md
│  └─ screenshots/
├─ public/
│  └─ data/
│     └─ default-dataset.json
├─ src/
│  ├─ app/
│  ├─ components/
│  │  ├─ layout/
│  │  ├─ ui/
│  │  └─ training/
│  ├─ features/
│  │  ├─ dataset/
│  │  ├─ training/
│  │  ├─ review/
│  │  ├─ schools/
│  │  ├─ mock/
│  │  └─ backup/
│  ├─ models/
│  │  ├─ dataset.ts
│  │  └─ training.ts
│  ├─ pages/
│  ├─ storage/
│  ├─ lib/
│  ├─ styles/
│  └─ test/
├─ e2e/
└─ .github/workflows/deploy.yml
```

## 8. 数据模型

`public/data/default-dataset.json` 是首版内容源，前端必须为它建立 TypeScript 类型和 runtime validation。

核心接口建议：

```ts
type Priority = "S" | "A" | "B";
type MasteryLevel = 0 | 1 | 2 | 3 | 4;

type SourceType =
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
  | "school-specific";

interface VivaQuestion {
  id: string;
  scope: "general" | "school";
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
```

重要：题库中的 `favorite/mastery/practice` 是默认值。运行时用户状态建议独立存储，以 `questionId` 关联，而不是每次把 246 道题完整复制进 localStorage。

## 9. 运行时状态模型

建议：

```ts
interface QuestionProgress {
  questionId: string;
  mastery: MasteryLevel;
  favorite: boolean;
  totalPractices: number;
  lastPracticedAt?: string;
  nextReviewAt?: string;
  greenStreak: number;
  lastFollowUpResult?: "passed" | "stuck" | "not-attempted";
}

interface PracticeRecord {
  id: string;
  questionId: string;
  practicedAt: string;
  mastery: MasteryLevel;
  followUpsAttempted: number;
  followUpsPassed: number;
  mode: "daily" | "question-bank" | "review" | "school" | "mock";
  schoolId?: string;
}
```

## 10. Review Scheduling

透明优先，不搞黑箱算法：

```ts
function getNextReviewDays(level: MasteryLevel, greenStreak: number) {
  if (level === 1) return 1;
  if (level === 2) return 3;
  if (level === 3) return greenStreak >= 2 ? 14 : 7;
  if (level === 4) return 14;
  return 0;
}
```

用户可在设置中调整，但首版默认值固定。

## 11. 推荐队列算法

不要纯随机。

给每题计算 score：

```text
+100 红题且到期
+80  黄题且到期
+65  当前院校截图真题
+55  当前院校官方范围/官方方向
+50  从未练过的 S
+35  S 且超过 7 天未练
+25  A 且到期
+15  跨校高频主题
-30  今天已经练过
```

同分再按 `lastPracticedAt` 最久优先，并做轻量随机扰动避免每天顺序完全一样。

必须写单元测试确保优先级行为可预测。

## 12. 数据加载与迁移

参考 `qingyun-speak` 的优秀做法：

- 默认题库通过 `fetch(${import.meta.env.BASE_URL}data/default-dataset.json)` 加载；
- runtime validate；
- localStorage 使用版本化 key；
- schemaVersion 变化时显式迁移；
- 默认题库更新不能无条件清空用户进度。

建议 key：

```text
qingyun-viva:progress:v1
qingyun-viva:history:v1
qingyun-viva:plans:v1
qingyun-viva:settings:v1
qingyun-viva:mock:v1
```

## 13. Dataset Validation

启动时至少校验：

- `schemaVersion === 1`；
- question id 唯一；
- priority 合法；
- mastery 0~4；
- schoolId 可在 `schools` 找到；
- subjectId 可在 `subjects` 找到；
- screenshot 真题不得缺学校；
- `followUps` 必须为字符串数组；
- 246 道题不能静默丢失。

出现错误显示可理解的 fatal state，同时在 console 输出具体字段路径。

## 14. 搜索

首版不引入全文索引库，246 题直接做标准化字符串匹配即可：

搜索字段：

- question；
- spoken answer；
- explanation；
- tags；
- subject；
- school name。

中文搜索 trim + lowercase 即可；可简单移除连续空格。

## 15. Mock Interview Engine

模拟生成时必须避免同一知识点连续重复。

基本规则：

- 先根据用户条件筛候选；
- S 题权重大于 A；
- 当前院校题权重大于公共题；
- 题目 subject 尽量轮换；
- 项目追问题不超过总题数 30%，除非用户指定；
- 有 followUps 的题按概率追加 1 条追问。

模拟期间将结果暂存 session state，结束后一次性写历史。

## 16. Accessibility / Web QA

最终必须调用 `web-design-guidelines` 对：

```text
src/**/*.tsx
src/**/*.css
index.html
```

做完整审查，修复所有明确问题后再交付。

重点检查：

- focus-visible；
- icon buttons aria-label；
- timer 的 aria-live 不要每秒骚扰屏幕阅读器；
- color + text 双重表达 mastery；
- dialog / bottom sheet focus trap；
- mobile touch target；
- reduced motion；
- URL 反映筛选状态；
- 深色/浅色若实现，要正确 `color-scheme`。

## 17. frontend-design Skill 使用要求

在写主要页面之前必须调用 / 阅读 `frontend-design` skill，并让它参与：

- 产品整体 visual direction；
- Dashboard；
- 单题训练页；
- 院校卡片；
- 模拟专注页；
- README 截图呈现。

它的目标不是“再生成一套设计”，而是帮助实现一个有明确视觉观点、避免 AI 模板感的 production-grade UI。

## 18. GitHub Pages

必须设置 Vite base：

```ts
base: "/qingyun-viva/"
```

路由使用 `HashRouter`。

Workflow 使用 GitHub Pages 官方 Actions：checkout → setup-node → npm ci → test/build → upload-pages-artifact → deploy-pages。

部署后必须用真实线上地址进行 Playwright smoke test，而不是只检查本地 preview。

## 19. README 产品化

最终 README 必须像产品主页，不像课程作业：

- 品牌名 + slogan；
- 在线入口；
- 一句话说明解决的问题；
- 3 张以上真实产品截图；
- 核心训练闭环；
- 题库规模和来源分层；
- 今日研习 / 题库 / 单题 / 院校 / 模拟的功能简介；
- 本地数据与隐私；
- 本地开发命令；
- 技术栈；
- 数据来源免责声明：预测题不等于真题。

截图必须来自最终版本，放在 `docs/screenshots/`，禁止使用 mockup 替代真实 UI。

## 20. 与 Qingyun Speak 的关系

可以参考 `LiPume/qingyun-speak`：

- `src/app/App.tsx`：HashRouter 结构；
- `src/models/dataset.ts` / `training.ts`：类型拆分；
- `src/features/dataset/DatasetContext.tsx`：默认 JSON 加载；
- localStorage / backup 的设计思路；
- Dashboard → Questions → Detail 的训练流。

但是不要机械复制：

- 不需要 pronunciation 模块；
- 专业课需要学校、证据、review due、追问链、mock interview；
- 新视觉必须由“青云问道”的产品定位重新设计。
