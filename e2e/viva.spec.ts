import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const consoleErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  consoleErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("./");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
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

test("完整备份可导出并从 JSON 恢复", async ({ page }) => {
  await page.goto("./#/settings");
  await page.getByLabel("每日目标题数").fill("12");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出完整备份" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const backup = JSON.parse(await readFile(path!, "utf8")) as { app: string; schemaVersion: number; settings: { dailyGoal: number } };
  expect(backup).toMatchObject({ app: "qingyun-viva", schemaVersion: 1, settings: { dailyGoal: 12 } });
  const restored = { ...backup, settings: { ...backup.settings, dailyGoal: 7 } };
  await page.getByLabel("选择青云问道备份 JSON").setInputFiles({ name: "restore.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(restored)) });
  await expect(page.getByText(/restore.json/)).toBeVisible();
  await expect(page.getByLabel("每日目标题数")).toHaveValue("7");
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
