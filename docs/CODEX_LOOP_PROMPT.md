# Codex 自主实现 Prompt — 青云问道 · Qingyun Viva

你正在本地目录：

`/Users/lzx/Desktop/保研资料/复试准备/专业课面试/qingyun-viva`

你的任务是把这个目录完整实现为可公开使用的产品 **「青云问道 · Qingyun Viva」——保研专业课面试训练台**，并部署到 GitHub Pages。

## 一、权威输入

开始前必须完整阅读：

1. `docs/PRD.md`
2. `docs/DESIGN.md`
3. `public/data/default-dataset.json`

可参考但不要修改另一个项目：

- `https://github.com/LiPume/qingyun-speak`

特别值得参考它的：HashRouter、默认 JSON 加载、localStorage、训练历史、备份恢复、测试和 GitHub Pages 结构；但青云问道必须独立重做专业课数据模型、追问、院校、间隔复习、模拟面试和视觉体系。

## 二、必须使用的 Skills

### 1. frontend-design

在开始写核心 UI 前调用 / 阅读 **frontend-design** skill。让它确定并约束整体 visual direction，尤其是：

- Dashboard
- 题库
- 单题训练
- 院校页
- 模拟面试专注模式

目标：production-grade、具有“现代研习桌 / 书卷 / 青云问道”的明确审美，不要出现千篇一律 AI Dashboard 感。

### 2. web-design-guidelines

核心功能全部完成后，必须调用 **web-design-guidelines** 对 `src/**/*.tsx`、`src/**/*.css`、`index.html` 做最终 UI / UX / Accessibility 审查。

审查发现的问题必须实际修复，然后重新 lint / test / e2e / build / visual QA。不能只生成审查报告不处理。

## 三、自主工作模式

从现在开始进入持续实现循环：

**inspect → plan → implement → test → browser QA → fix → re-test → refine → deploy → verify → document → commit/push**

只要 Definition of Done 尚未全部满足，就继续下一轮，不要因为某一个小步骤成功而停止。

### 不要频繁询问用户

遇到普通工程选择时自行做最合理决定，不要停下来问“要不要继续”“选哪个颜色”“是否可以这样做”。

只有满足下面“硬阻塞”条件时才允许停下：

- 缺少系统级权限且无法通过现有工具解决；
- GitHub SSH / `gh` 身份验证完全不可用，且尝试至少 3 种可行路径仍失败；
- GitHub Pages 必须由仓库管理员手工切换设置且 CLI/API 无权操作；
- 输入文件损坏或关键数据无法读取。

发生硬阻塞时：

1. 先至少尝试 3 种独立解决方案；
2. 创建 `CODEX_BLOCKERS.md`，记录命令、错误、尝试和用户只需执行的最小动作；
3. 继续完成所有不依赖该阻塞的工作；
4. 最后才停止。

## 四、实现范围

严格按 PRD 的 P0 全部实现，并在 P0 完成、测试稳定后再实现不显著增加风险的 P1。

必须包含：

- 今日研习与智能推荐队列；
- 题库组合搜索/筛选；
- 单题隐藏答案口述训练；
- 45/60/90 秒 timer；
- progressive reveal：口述版 / 解析 / 记忆钩子 / 追问 / 来源；
- 红 / 黄 / 绿 / 熟练四级自评；
- 追问接住/卡住；
- 间隔复习；
- 复习簿；
- 12 所院校页和院校模式；
- 真题 / 官方 / 同校面经 / 预测证据分层；
- 全真模拟面试；
- 练习统计；
- localStorage；
- JSON 完整备份与恢复；
- 默认题库重置但可保留训练进度；
- responsive；
- accessibility；
- unit / E2E tests；
- GitHub Pages；
- 产品级 README + 真实截图。

## 五、数据要求

`public/data/default-dataset.json` 是内容事实源。

必须：

- runtime validate；
- 保留 246 道题；
- id 唯一；
- 保留 12 校；
- 保留 source type；
- 保留 followUps；
- 不把 predicted-high-probability 显示成真题；
- 不擅自改写题库知识内容；
- 用户 progress 与默认题库内容分离存储。

首次测试必须断言：

```text
questions.length === 246
schools.length === 12
general === 143
school === 103
S === 133
A === 71
B === 42
```

## 六、工程要求

建议栈：React + TypeScript + Vite + React Router + Tailwind CSS + lucide-react + Vitest + Playwright。

若目录为空，直接初始化项目；若已有内容，先审计再演进，禁止无理由删除用户文件。

GitHub Pages：

- Vite `base: "/qingyun-viva/"`
- `HashRouter`
- `.github/workflows/deploy.yml`

应有 npm scripts：

```text
npm run dev
npm run lint
npm run test
npm run test:e2e
npm run build
npm run preview
```

## 七、测试循环

每个核心模块完成后立刻测试，不要等全部写完。

至少执行：

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

Playwright 至少用这些 viewport：

- 390 × 844
- 768 × 1024
- 1440 × 1000

手工/自动视觉检查：

- 无横向溢出；
- 无文字遮挡；
- 手机底部导航不挡内容；
- 长问题正常折行；
- 中文 / 英文 / 复杂度公式不跳版；
- focus 清晰；
- 弹窗可键盘关闭；
- reduced motion 生效。

每发现一个问题就修，再从 lint/test/build/e2e 中相关步骤重新跑；不要留下“已知小问题”。

## 八、Git 和远程仓库

目标远程：

`git@github.com:LiPume/qingyun-viva.git`

开始时检查：

```bash
git status
git remote -v
```

如果还没有 git：

```bash
git init
git branch -M main
```

如果没有 origin：

```bash
git remote add origin git@github.com:LiPume/qingyun-viva.git
```

如果 origin 存在但不是这个地址，在确认是当前仓库后：

```bash
git remote set-url origin git@github.com:LiPume/qingyun-viva.git
```

不要 force push，不重写已有远程历史。若远程已有提交，先 fetch / rebase 或合理合并。

开发过程中可以分阶段 commit，但最终必须：

```bash
git status
git add -A
git commit -m "feat: launch Qingyun Viva interview training desk"  # 若有未提交改动
git push -u origin main
```

确保最终 working tree clean。

## 九、部署和线上验证

Push 后不要把“代码推上去”当作完成。

继续：

1. 检查 GitHub Actions；
2. 如失败，读 log、修复、push，再等；
3. 直到 Pages workflow green；
4. 访问：`https://lipume.github.io/qingyun-viva/`；
5. 用 Playwright 对线上地址执行 smoke test；
6. 验证首页、题库、题目详情、学校页、模拟页、刷新 / hash 路由；
7. 浏览器 console 不能有未解释 error。

如果 Pages 尚未启用而 `gh` 已认证，尝试通过 GitHub CLI/API 配置为 Actions；无权限才按硬阻塞规则处理。

## 十、最终截图与 README

只在最终 UI 完成且线上验证通过后截图。

建议截图：

```text
docs/screenshots/dashboard.png
docs/screenshots/questions.png
docs/screenshots/question-detail.png
docs/screenshots/schools.png
docs/screenshots/mock-interview.png
```

截图必须来自实际运行页面（优先线上），不能做假的设计 mockup。

README 至少包含：

- 青云问道 · Qingyun Viva；
- slogan；
- 在线访问链接；
- 产品截图；
- 产品解决的问题；
- 训练闭环；
- 246 题 / 12 校 / 证据分层；
- 功能说明；
- 数据隐私（local-only）；
- 技术栈；
- 本地运行；
- 数据来源声明；
- 和“青云研语”的系列关系可以一句话带过。

更新 README 后再跑一次 build / e2e，commit 并 push。

## 十一、Definition of Done（逐项确认，不满足就继续 loop）

- [ ] PRD P0 全部可用
- [ ] 246 道题全部加载
- [ ] 12 所院校全部可访问
- [ ] 证据标签无误
- [ ] 今日推荐工作
- [ ] 单题闭卷口述完整工作
- [ ] 追问完整工作
- [ ] 四级自评和 review scheduling 工作
- [ ] 复习簿工作
- [ ] 院校模式工作
- [ ] 模拟面试工作
- [ ] localStorage / backup / restore 工作
- [ ] 手机 / 平板 / 桌面响应式通过
- [ ] Accessibility 通过
- [ ] `frontend-design` 已实际用于 UI 阶段
- [ ] `web-design-guidelines` 审查问题已修复
- [ ] lint 通过
- [ ] unit tests 通过
- [ ] E2E 通过
- [ ] build 通过
- [ ] GitHub Actions green
- [ ] 线上 Pages 可访问
- [ ] 线上 smoke test 通过
- [ ] 真实产品截图已写入 repo
- [ ] README 产品化完成
- [ ] 最终代码 commit + push 到 `origin/main`
- [ ] `git status` clean

**只要还有一个未完成，就继续工作循环。**
