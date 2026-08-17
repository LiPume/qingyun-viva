import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const consoleErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  consoleErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("qingyun-viva:e2e-ready")) {
      localStorage.clear();
      sessionStorage.setItem("qingyun-viva:e2e-ready", "1");
    }
  });
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "今日不求看完，只求说清。" })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(consoleErrors.get(page), "browser console errors").toEqual([]);
});

test("首次打开加载 246 题，production base 资源可用", async ({ page, request }) => {
  const response = await request.get("./data/default-dataset.json");
  expect(response.ok()).toBe(true);
  const data = await response.json() as { questions: unknown[]; schools: unknown[] };
  expect(data.questions).toHaveLength(246);
  expect(data.schools).toHaveLength(12);
  await expect(page.getByText("133", { exact: false }).first()).toBeVisible();
});

test("Dashboard 完成红题自评并更新复习时间", async ({ page }) => {
  await page.goto("./#/question/GEN-DS-S-001-4cbf7a?mode=daily");
  await expect(page.getByRole("heading", { name: /哈希表/ })).toBeVisible();
  await expect(page.locator(".spoken-answer")).toHaveCount(0);
  await page.getByRole("button", { name: "开始作答" }).click();
  await page.getByRole("button", { name: "我答完了" }).click();
  await expect(page.getByText("先对照你刚才的表达")).toBeVisible();
  await page.getByRole("button", { name: /不会/ }).click();
  await expect(page.getByText("本次口述已记录")).toBeVisible();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem("qingyun-viva:progress:v1") ?? "{}") as Record<string, { mastery: number; nextReviewAt: string }>);
  expect(progress["GEN-DS-S-001-4cbf7a"].mastery).toBe(1);
  const deltaDays = (new Date(progress["GEN-DS-S-001-4cbf7a"].nextReviewAt).getTime() - Date.now()) / 86_400_000;
  expect(deltaDays).toBeGreaterThan(0.95);
  expect(deltaDays).toBeLessThan(1.05);
});

test("追问一次只揭示一条并可标记卡住", async ({ page }) => {
  await page.goto("./#/question/SCH-NWPU-010-99d815");
  await page.getByRole("button", { name: "开始作答" }).click();
  await page.getByRole("button", { name: "我答完了" }).click();
  await expect(page.getByText("前三个月具体做什么？")).toBeVisible();
  await expect(page.getByText("失败了怎么办？")).toHaveCount(0);
  await page.getByRole("button", { name: "卡住了" }).click();
  await page.getByRole("button", { name: /下一追问/ }).click();
  await expect(page.getByText("失败了怎么办？")).toBeVisible();
});

test("题库组合筛选并保持 URL，复旦截图真题可见", async ({ page }) => {
  await page.goto("./#/questions");
  await page.getByLabel("目标院校").selectOption("fudan");
  await page.getByLabel("优先级").selectOption("S");
  await page.getByLabel("证据类型").selectOption("screenshot-verified");
  await expect(page).toHaveURL(/school=fudan/);
  await expect(page).toHaveURL(/source=screenshot-verified/);
  await expect(page.locator(".question-results .source-verified").first()).toHaveText("截图真题");
  await expect(page.getByText(/当前显示 [1-9]/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("目标院校")).toHaveValue("fudan");
});

test("院校模式切换会进入 Dashboard 语境", async ({ page }) => {
  await page.goto("./#/schools/fudan");
  await page.getByRole("button", { name: "设为当前模式" }).click();
  await expect(page.getByText(/已将 复旦大学 提高到 Dashboard/)).toBeVisible();
  await page.goto("./#/");
  await expect(page.getByText("复旦大学模式已开启，优先练该校真题与官方范围。")).toBeVisible();
});

test("模拟面试 5 题完整走通并统一写入历史", async ({ page }) => {
  await page.goto("./#/mock");
  await page.getByRole("button", { name: /生成本场面试/ }).click();
  await expect(page.getByText("Question 01 / 05")).toBeVisible();
  for (let index = 0; index < 5; index += 1) {
    await page.locator(".mock-rate.rate-1").click();
  }
  await expect(page.getByRole("heading", { name: "本场口试已完成" })).toBeVisible();
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem("qingyun-viva:history:v1") ?? "[]") as Array<{ mode: string }>);
  expect(history).toHaveLength(5);
  expect(history.every((record) => record.mode === "mock")).toBe(true);
});

test("学习档案可独立导出并从 JSON 恢复", async ({ page }) => {
  await page.goto("./#/settings");
  await page.getByLabel("每日目标题数").fill("12");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出学习档案" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const backup = JSON.parse(await readFile(path!, "utf8")) as { app: string; schemaVersion: number; settings: { dailyGoal: number } };
  expect(backup).toMatchObject({ app: "qingyun-viva", schemaVersion: 1, settings: { dailyGoal: 12 } });
  const restored = { ...backup, settings: { ...backup.settings, dailyGoal: 7 } };
  await page.getByLabel("选择青云问道学习档案 JSON").setInputFiles({ name: "restore.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(restored)) });
  await expect(page.getByText(/restore.json/)).toBeVisible();
  await expect(page.getByLabel("每日目标题数")).toHaveValue("7");
});

test("完整题库可下载、加入院校和周期后导入，刷新持久且可无损恢复默认", async ({ page }) => {
  await page.goto("./#/settings");
  const defaultDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载内置模板" }).click();
  const defaultDownload = await defaultDownloadPromise;
  const defaultPath = await defaultDownload.path();
  expect(defaultPath).not.toBeNull();
  const custom = JSON.parse(await readFile(defaultPath!, "utf8")) as {
    reviewPolicy: { redDays: number; yellowDays: number; greenDays: number; greenStreak2Days: number; description: string };
    schools: Array<Record<string, unknown>>;
    questions: Array<Record<string, unknown>>;
  };
  expect(custom.questions).toHaveLength(246);
  expect(custom.schools).toHaveLength(12);
  custom.reviewPolicy = { redDays: 2, yellowDays: 4, greenDays: 8, greenStreak2Days: 16, description: "E2E custom policy" };
  custom.schools.push({ id: "my-university", name: "我的目标大学", college: "计算机学院", direction: "人工智能" });
  custom.questions.push({
    id: "CUSTOM-E2E-001",
    subjectId: "data-structures",
    question: "这是一道可导入的自定义题吗？",
    answer: { spoken: "可以，导入后它会成为当前题库的一部分。" },
    schools: ["my-university"],
    source: { type: "user-authored", label: "用户自建" },
  });
  await page.getByLabel("选择青云问道题库 JSON").setInputFiles({ name: "my-viva.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(custom)) });
  const preview = page.getByRole("region", { name: "待启用题库" });
  await expect(preview).toContainText("my-viva.json");
  await expect(preview).toContainText("247");
  await expect(preview).toContainText("13");
  await expect(preview).toContainText("红 2 天 · 黄 4 天 · 绿 8 天");
  await page.getByRole("button", { name: "确认启用" }).click();
  await expect(page.getByText(/已启用 my-viva.json/)).toBeVisible();

  await page.reload();
  await expect(page.getByText("my-viva.json", { exact: false })).toBeVisible();
  await expect(page.getByLabel("当前题库概况")).toContainText("247");
  await page.goto("./#/schools");
  await expect(page.getByRole("link", { name: "我的目标大学", exact: true })).toBeVisible();
  await page.goto("./#/question/CUSTOM-E2E-001");
  await page.getByRole("button", { name: "开始作答" }).click();
  await page.getByRole("button", { name: "我答完了" }).click();
  await page.getByRole("button", { name: /不会/ }).click();
  const customProgress = await page.evaluate(() => JSON.parse(localStorage.getItem("qingyun-viva:progress:v1") ?? "{}") as Record<string, { nextReviewAt: string }>);
  const customDeltaDays = (new Date(customProgress["CUSTOM-E2E-001"].nextReviewAt).getTime() - Date.now()) / 86_400_000;
  expect(customDeltaDays).toBeGreaterThan(1.95);
  expect(customDeltaDays).toBeLessThan(2.05);

  await page.goto("./#/settings");
  const currentDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出当前题库" }).click();
  const currentPath = await (await currentDownloadPromise).path();
  const exported = JSON.parse(await readFile(currentPath!, "utf8")) as { questions: unknown[]; schools: unknown[] };
  expect(exported.questions).toHaveLength(247);
  expect(exported.schools).toHaveLength(13);
  await page.getByRole("button", { name: "恢复内置题库" }).click();
  await expect(page.getByLabel("当前题库概况")).toContainText("246");
  await expect(page.getByText(/另有 1 道题的历史状态被保留/)).toBeVisible();
  const retained = await page.evaluate(() => JSON.parse(localStorage.getItem("qingyun-viva:progress:v1") ?? "{}") as Record<string, unknown>);
  expect(retained["CUSTOM-E2E-001"]).toBeDefined();
});

test("无效自定义题库不会覆盖当前有效题库", async ({ page }) => {
  await page.goto("./#/settings");
  const invalid = { schemaVersion: 1, subjects: [{ id: "one", name: "测试" }], schools: [], questions: [{ id: "bad", subjectId: "missing", question: "错误引用", answer: { spoken: "无效" } }] };
  await page.getByLabel("选择青云问道题库 JSON").setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(invalid)) });
  await expect(page.getByText(/题库未导入.*不存在的科目/)).toBeVisible();
  await expect(page.getByLabel("当前题库概况")).toContainText("246");
  expect(await page.evaluate(() => localStorage.getItem("qingyun-viva:dataset:v1"))).toBeNull();
});

test("手机/平板/桌面无横向溢出，hash 路由可刷新", async ({ page }) => {
  for (const route of ["./#/", "./#/questions", "./#/schools", "./#/mock", "./#/review"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
  await page.goto("./#/questions?q=TCP");
  await page.reload();
  await expect(page.getByRole("heading", { name: "专业课题库" })).toBeVisible();
  await expect(page.locator("#question-search")).toHaveValue("TCP");
});
