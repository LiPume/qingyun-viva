import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseURL = process.env.QA_BASE_URL ?? "http://127.0.0.1:4173/qingyun-viva/";
const outputDir = process.env.QA_OUTPUT_DIR ?? "/tmp/qingyun-viva-visual-qa";
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const errors = [];
const results = [];

async function capture({ name, route, width, height, action }) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "no-preference" });
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name}: ${message.text()}`); });
  await page.goto(`${baseURL}${route}`);
  await page.waitForLoadState("networkidle");
  if (action) await action(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const path = `${outputDir}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  results.push({ name, route, viewport: `${width}x${height}`, overflow, title: await page.title(), path });
  await context.close();
}

await capture({ name: "dashboard", route: "#/", width: 1440, height: 1000 });
await capture({ name: "questions", route: "#/questions?school=fudan&source=screenshot-verified", width: 1440, height: 1000 });
await capture({ name: "question-mobile-closed", route: "#/question/GEN-DS-S-001-4cbf7a", width: 390, height: 844 });
await capture({
  name: "question-detail",
  route: "#/question/SCH-NWPU-010-99d815",
  width: 390,
  height: 844,
  action: async (page) => {
    await page.getByRole("button", { name: "开始作答" }).click();
    await page.getByRole("button", { name: "我答完了" }).click();
  },
});
await capture({ name: "schools", route: "#/schools", width: 768, height: 1024 });
await capture({ name: "mock-interview", route: "#/mock", width: 1440, height: 1000 });

await browser.close();
process.stdout.write(`${JSON.stringify({ baseURL, outputDir, errors, results }, null, 2)}\n`);
if (errors.length || results.some((result) => result.overflow > 1)) process.exitCode = 1;
