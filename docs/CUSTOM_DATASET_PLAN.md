# 青云问道：可编辑题库导入导出方案

## 1. 结论

不要扩大现有“完整备份”的含义。应把设置页中的本地数据明确拆成两类：

1. **题库内容**：问题、答案、科目、院校、证据、复习周期和学习计划；可以下载、编辑、导入并分享给别人。
2. **学习档案**：个人掌握度、收藏、练习历史和偏好；只用于个人迁移，不应默认与题库一起分享。

第一版实现“整套题库替换”，不做增量合并和网页内可视化编辑器。这样最贴合“下载 `default-dataset.json`，调整后再导入”的真实工作流，也更容易保证数据安全与可恢复。

## 2. 当前实现为什么不能直接满足

- 设置页的“导出完整备份”只导出 `progress/history/settings`，没有任何题目、答案或院校内容。
- `DatasetContext` 只会从 `public/data/default-dataset.json` 加载数据，刷新后无法继续使用导入的题库。
- `validateDataset` 强制恰好 246 题、12 校以及固定的 S/A/B 分布，加入第 13 所学校或第 247 道题必然失败。
- `reviewPolicy` 虽然写在 dataset 中，实际排期仍在 `src/lib/training.ts` 中硬编码为 1/3/7/14 天。

## 3. 设置页信息架构

```text
设置与数据
├─ 研习偏好
│  ├─ 每日目标题数
│  └─ 默认口述时长
│
├─ 题库内容
│  ├─ 当前：内置题库 / 自定义题库名称
│  ├─ 246 题 · 12 校 · 14 科 · 红1/黄3/绿7/熟练14天
│  ├─ [下载内置题库模板] [导出当前题库]
│  ├─ [导入自定义题库]
│  ├─ 导入预览：文件名、题/校/科数量、复习周期、变化和警告
│  ├─ [确认启用] [取消]
│  └─ [恢复内置题库，保留学习档案]
│
├─ 学习档案
│  ├─ 说明：仅含掌握度、收藏、历史和设置，不含题库
│  ├─ [导出学习档案]
│  └─ [导入学习档案]
│
└─ 危险操作
   └─ [清空训练历史]
```

现有按钮文案调整：

- “导出完整备份”改为“导出学习档案”；
- “导入备份”改为“导入学习档案”；
- “默认题库”升级为“题库内容”。

视觉上继续沿用设置页现有的横向条目结构。只在导入文件后展开一张“验卷单”式预览，不增加新的大卡片墙或多步向导。

## 4. 用户工作流

### 4.1 分享或制作题库

1. 点击“下载内置题库模板”，得到完整的 `qingyun-viva-dataset-default.json`。
2. 在本地编辑 JSON：加入院校、题目，或修改 `reviewPolicy`。
3. 在网站点击“导入自定义题库”并选择文件。
4. 网站只解析和校验，不立即覆盖当前题库。
5. 页面展示导入预览，例如：`247 题（+1）· 13 校（+1）· 红2/黄4/绿8/熟练16天`。
6. 用户确认后，网站原子保存并切换到新题库；刷新后仍使用该题库。

### 4.2 修改复习周期

导入预览中提供显式选项：

```text
[✓] 按新周期重算已有题目的下次复习时间
```

- 勾选：保留历史、掌握度和连续绿色次数，只根据 `lastPracticedAt` 和新周期重算 `nextReviewAt`。
- 不勾选：已有日期不变，新周期只应用于之后提交的自评。

默认勾选，但必须在确认按钮旁说明影响，不能静默改动已有排期。

### 4.3 恢复默认题库

“恢复内置题库”只删除自定义 dataset key 并重新加载静态 JSON：

- 不删除练习历史、掌握度和收藏；
- 与默认题目 ID 相同的状态继续显示；
- 自定义题目的状态暂时保留但隐藏，以后重新导入相同 ID 时恢复。

## 5. 数据与持久化设计

新增版本化 key：

```text
qingyun-viva:dataset:v1
```

`dataset:v1` 使用一个原子 envelope，同时保存完整、已经 normalize 和 validate 的当前自定义题库、来源文件名和导入时间，避免多个 key 之间出现半写入状态。

加载优先级：

```text
有效的本地自定义题库 → 内置 default-dataset.json → 可恢复错误页
```

若本地题库因手工篡改或版本变化而无效：自动回退内置题库，同时提示“自定义题库无法加载，当前已使用内置题库”，不能让整个应用白屏。

当前默认文件约 366 KB，使用 localStorage 足够。第一版限制导入文件不超过 4 MB，并捕获浏览器 quota 错误；未来如果要支持图片或超大题库，再迁移到 IndexedDB。

## 6. Schema 与校验策略

把校验拆成两层：

### 6.1 Runtime validation

允许题量、院校数量和 S/A/B 分布变化，但继续严格保证：

- `schemaVersion === 1`；
- question、school、subject 的 ID 各自唯一；
- question 的 `subjectId`、`schools[]` 必须存在；
- school scope 题必须至少关联一所学校；
- `screenshot-verified` 题必须关联学校；
- priority、source type、mastery、followUps 类型合法；
- `reviewPolicy` 的天数为 1–365 的整数，且长期周期不短于普通绿色周期；
- 文件大小、数组规模和关键字符串长度有合理上限；
- 导入错误包含准确字段路径和可理解的中文说明。

`metadata.counts` 不再作为可信输入，应在导入时根据 questions 重新计算，避免用户加题后忘记同步计数。

为了降低手改 JSON 的门槛，normalizer 可为部分字段补默认值：

- school 除 `id/name` 外的展示字段允许空值；
- question 的 `followUps/schools/tags` 缺省为 `[]`；
- 用户自建题的 source 可使用新增类型 `user-authored`；
- dataset 内的 `favorite/mastery/practice` 仍只作为默认值，真实状态继续独立保存。

### 6.2 Default asset golden validation

单独保留默认资产测试，继续断言：

- 246 题、12 校、14 科；
- general/school = 143/103；
- S/A/B = 133/71/42；
- 默认 question ID 不重复。

这样既能允许用户自定义，又不会让仓库自带题库静默丢题。

## 7. 进度兼容规则

题库和个人状态始终通过稳定 `questionId` 关联：

- ID 未变化：保留掌握度、收藏和历史；
- 新 ID：按未练处理；
- 被删除的 ID：状态保留但不出现在当前题库；
- 已删除学校若正是 `currentSchoolId`：自动退出院校模式，并提示用户；
- 不允许导入过程直接清空 progress/history。

编辑说明必须强调：修改题目文本时尽量保留 ID；只有把它视为一条新题时才更换 ID。

## 8. 复习周期真正接入运行时

将固定函数改为显式接收策略：

```ts
getNextReviewDays(level, greenStreak, reviewPolicy)
getNextReviewAt(level, greenStreak, practicedAt, reviewPolicy)
```

`AppStateProvider` 已位于 `DatasetProvider` 内部，可以读取当前 dataset 的 `reviewPolicy`。所有单题训练、复习簿和模拟面试写入均统一使用当前策略，避免不同入口产生不同排期。

## 9. 文件级实施计划

### Phase A：数据层

- `src/models/dataset.ts`：补充 authoring/default 类型与 `user-authored` 来源。
- `src/features/dataset/validate.ts`：拆分 normalize、runtime validate、default golden validate。
- 新建 `src/features/dataset/storage.ts`：读取、保存、删除自定义题库与 meta，处理 quota/损坏回退。
- `src/features/dataset/DatasetContext.tsx`：暴露 `importDataset`、`exportDataset`、`resetToDefault`、`datasetSource` 和导入预览。

### Phase B：动态复习策略

- `src/lib/training.ts`：排期函数接收 `reviewPolicy`。
- `src/features/training/AppStateContext.tsx`：使用当前题库策略，并新增可选的已有排期重算操作。
- 保持现有学习档案 `schemaVersion: 1` 向后兼容。

### Phase C：设置页

- `src/pages/SettingsPage.tsx`：按“题库内容 / 学习档案”重组按钮和文案。
- 新增导入预览、确认、取消、失败说明和当前数据来源标识。
- `src/styles/main.css`：只补充预览区、变化提示和移动端布局。

### Phase D：编辑说明

- 新建 `docs/DATASET_EDITING.md`：提供新增学校、新增题目、调整复习周期三个最小示例。
- 更新 `README.md`：说明自定义题库只保存在当前浏览器，以及如何恢复内置题库。

### Phase E：测试与上线

- 单元测试：动态规模、引用关系、重复 ID、错误路径、计数重算、复习周期和损坏回退。
- E2E：下载完整题库；导入第 13 校/第 247 题；刷新后仍生效；新周期产生正确日期；恢复默认后仍保留进度；无效 JSON 不覆盖旧题库。
- 浏览器 QA：桌面、平板、手机的设置页和导入预览；检查键盘操作、状态播报、console 与横向溢出。
- 完成后再执行 lint、unit、build、E2E、Pages 部署和线上复验。

## 10. 第一版明确不做

- 不做网页内完整题目/院校编辑器；先用 JSON 作为可移植格式。
- 不做增量 merge；导入代表替换当前题库，避免同 ID 冲突规则失控。
- 不把个人学习档案默认塞进可分享题库，避免泄漏目标院校、收藏和练习历史。
- 不支持 JSON 中嵌入图片或可执行 HTML。
- 不把“自定义内容”解释为白标建站；应用仍叫“青云问道”，只替换学习内容。

## 11. 验收标准

- 导出的当前题库包含全部顶层字段、全部题目、全部院校和 `reviewPolicy`。
- 用户能通过 JSON 新增院校和题目，导入后所有相关页面正常访问。
- 修改复习周期后，未来排期必然使用新值；重算已有日期必须由用户显式确认。
- 导入成功后刷新/重开仍保持自定义题库。
- 无效文件、超限文件或存储失败不会覆盖最后一个有效题库。
- 恢复内置题库不会删除个人训练数据。
- 旧版学习档案仍可导入，现有用户无需迁移文件。
