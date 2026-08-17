# 青云问道题库 JSON 编辑指南

## 使用步骤

1. 在“设置与数据 → 题库内容”点击“下载内置模板”。
2. 复制一份 JSON 后再编辑，保留原文件用于恢复。
3. 编辑完成后点击“导入自定义题库”。
4. 核对题量、院校数、科目数和复习周期变化。
5. 点击“确认启用”；刷新页面后自定义题库仍然有效。

导入代表**替换当前题库**，不是增量合并。个人掌握度、收藏和练习历史不会被题库导入清空。

## 新增院校

在顶层 `schools` 数组中加入一个对象。`id` 必须唯一，建议只使用小写英文、数字和连字符：

```json
{
  "id": "my-university",
  "name": "我的目标大学",
  "college": "计算机学院",
  "direction": "计算机科学与技术",
  "assessmentSummary": "这里填写目前掌握的考核形式。",
  "evidenceText": "这里填写通知、面经或资料来源。",
  "practiceNote": "这里填写该校的训练提示。",
  "overview": {
    "school": "我的目标大学",
    "direction": "计算机学院 · 计算机科学与技术",
    "assessmentIntel": "专业基础与项目问答",
    "priorityPrep": "数据结构、操作系统、项目表达",
    "evidenceLevel": "用户自建"
  }
}
```

除 `id` 和 `name` 外，其他学校展示字段可以暂时省略，网站会补充安全的默认文案。

## 新增题目

在顶层 `questions` 数组加入一个对象。最小可用示例：

```json
{
  "id": "MY-SCHOOL-001",
  "subjectId": "data-structures",
  "question": "哈希表为什么需要处理冲突？",
  "answer": {
    "spoken": "因为不同关键字可能映射到同一地址，所以需要开放定址、链地址等冲突处理方法。"
  },
  "schools": ["my-university"],
  "source": {
    "type": "user-authored",
    "label": "用户自建"
  }
}
```

网站会自动补充：

- `scope`：有学校时为 `school`，否则为 `general`；
- `priority`：默认 `A`；
- `followUps`、`tags`：默认空数组；
- `mastery`、`favorite`、`practice`：仅作为题库默认值，真实训练状态仍独立保存。

如果需要追问、优先级和证据引用，可以使用完整形式：

```json
{
  "id": "MY-SCHOOL-002",
  "scope": "school",
  "subjectId": "operating-systems",
  "subject": "操作系统",
  "priority": "S",
  "stars": 5,
  "question": "进程和线程的核心区别是什么？",
  "answer": {
    "spoken": "进程是资源分配的基本单位，线程是 CPU 调度的基本单位。",
    "explanation": "同一进程内线程共享地址空间，但拥有各自的栈和寄存器上下文。",
    "memoryHook": "进程管资源，线程管执行。"
  },
  "followUps": ["为什么线程切换通常更轻量？"],
  "schools": ["my-university"],
  "source": {
    "type": "user-authored",
    "label": "用户自建",
    "reference": "个人整理"
  },
  "tags": ["进程", "线程"]
}
```

`subjectId` 必须引用顶层 `subjects` 中已经存在的科目。新增科目时至少填写：

```json
{
  "id": "computer-vision",
  "name": "计算机视觉",
  "order": 15
}
```

## 调整复习周期

修改顶层 `reviewPolicy`：

```json
{
  "redDays": 2,
  "yellowDays": 4,
  "greenDays": 8,
  "greenStreak2Days": 16,
  "description": "红 2 天、黄 4 天、绿 8 天，连续两次绿或熟练题 16 天。"
}
```

规则：

- 四个数值必须是 1–365 的整数；
- `redDays ≤ yellowDays ≤ greenDays ≤ greenStreak2Days`；
- 导入时可选择是否按新周期重算已有题目的 `nextReviewAt`；
- 不重算时，新周期只作用于之后提交的自评。

## ID 与进度

- 修改题目文字但希望保留原进度时，不要修改 `question.id`。
- 新问题应使用新 ID，否则会继承旧题的掌握度和历史。
- 删除题目不会删除其历史；重新导入相同 ID 后状态会恢复显示。
- 删除当前院校后，网站会自动退出该院校模式。

## 自动计数与校验

不需要手动维护 `metadata.counts`。导入时网站会根据当前 questions 自动重新计算总题数、general/school 和 S/A/B 数量。

题库文件最大 4 MB。以下情况会拒绝导入，而且不会覆盖当前有效题库：

- JSON 语法错误；
- ID 重复；
- 题目引用了不存在的科目或院校；
- 院校题没有关联学校；
- 复习周期顺序错误；
- 不支持的 schemaVersion 或来源类型。

## 恢复内置题库

点击“恢复内置题库”会重新加载网站随附的 246 题与 12 校，不会删除学习档案。若要同时迁移题库和个人进度，请分别导出“当前题库”和“学习档案”两个 JSON 文件。
