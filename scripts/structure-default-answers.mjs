import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const datasetPath = fileURLToPath(new URL("../public/data/default-dataset.json", import.meta.url));
const shouldWrite = process.argv.includes("--write");
const shouldForce = process.argv.includes("--force");

function stripOuterQuotes(value) {
  return value.trim().replace(/^“([\s\S]*)”$/u, "$1");
}

function splitSentences(value) {
  return stripOuterQuotes(value)
    .replace(/[ \t]+/g, " ")
    .split(/(?<=[。！？!?])\s*|(?<=\.)\s+(?=[A-Z“])/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitClauses(value) {
  const semicolonParts = stripOuterQuotes(value).split(/(?<=[；;])\s*/u).map((item) => item.trim()).filter((item) => item.length >= 8);
  if (semicolonParts.length >= 2) return semicolonParts;
  return stripOuterQuotes(value).split(/(?<=[，,])\s*/u).map((item) => item.trim()).filter((item) => item.length >= 8);
}

function groupContiguous(items, targetCount) {
  const groups = [];
  let start = 0;
  for (let index = 0; index < targetCount; index += 1) {
    const remaining = items.length - start;
    const slots = targetCount - index;
    const take = Math.ceil(remaining / slots);
    groups.push(items.slice(start, start + take).join(""));
    start += take;
  }
  return groups;
}

const fallbackTitles = ["核心要点", "工作机制", "关键性质", "应用与边界", "补充说明"];
const titleRules = [
  [/分为|包括|主要有|可以分成|按.+(?:分|看)|几类|常见.+有/iu, "分类与组成"],
  [/定义|是指|本质|含义|核心|表示|称为|叫作|叫做|是一种/iu, "定义与本质"],
  [/时间复杂度|空间复杂度|额外空间|O\(|开销|成本|效率|性能|代价/iu, "复杂度与代价"],
  [/区别|不同|相比|对比|差别|而是/iu, "比较与区别"],
  [/前提|条件|不能|不一定|注意|只适用|要求|最坏|风险|误区|边界|否则/iu, "条件与边界"],
  [/优化|改进|减轻|提高|避免|扩容|加速|缓解/iu, "优化与改进"],
  [/适合|适用于|应用|场景|用于|可以用来|作用/iu, "场景与应用"],
  [/例如|比如|举例|例子/iu, "例子与理解"],
  [/流程|过程|首先|然后|接着|每次|步骤|执行|触发|映射|通过|计算|生成|传输|负责/iu, "机制与过程"],
];

const directOverrides = {
  "GEN-DS-S-003-265a80": "这些排序算法的核心差别在于元素如何移动、平均与最坏复杂度以及是否稳定；回答时可以按这三个维度统一比较。",
  "GEN-DS-S-004-d3acd4": "最小生成树常用 Prim 和 Kruskal；最短路径常用 Dijkstra、Bellman-Ford 和 Floyd，它们解决的目标不同，不能混用。",
  "GEN-OS-S-023-a4df68": "常见调度算法包括 FCFS、SJF/SRTF、优先级、HRRN、时间片轮转和多级反馈队列，核心区别是选择下一个进程的规则以及是否允许抢占。",
  "GEN-PL-S-040-fe91df": "C、C++ 和 Java 的核心区别在于抽象层次、运行方式和内存管理：C 更贴近底层，C++ 在低层能力上支持多范式，Java 主要依赖 JVM 和垃圾回收。",
  "GEN-NET-A-015-bc1c71": "在浏览器输入网址后，系统会依次完成 URL 解析、DNS、网络连接与 TLS、HTTP 交互，最后由浏览器解析资源并渲染页面。",
  "GEN-DM-B-039-7b129a": "常见离散分布包括 Bernoulli、二项、几何、负二项、超几何和 Poisson，它们分别描述成败、计数、等待次数和不放回抽样等问题。",
  "SCH-NUDT-004-f0d0f0": "TCP 通过校验和、序列号与确认、超时和快速重传、滑动窗口、流量控制及拥塞控制，在不可靠的 IP 之上提供可靠有序字节流。",
  "SCH-NUDT-008-b31ae4": "选择国防科大计算机不能只说学校强，核心要说明研究问题、培养方式与自己的技术积累和长期目标为什么匹配。",
  "GEN-SE-S-036-3d41f8": "设计模式是针对反复出现的软件设计问题形成的可复用协作方案，我会结合策略模式说明它在项目中的具体落地。",
  "SCH-TONGJI-006-ef0145": "Overfitting means that a model learns the training data too closely, including noise, so it performs well on training data but poorly on unseen data.",
  "SCH-SUFE-003-0d62e5": "ACID refers to the four properties that make database transactions reliable: atomicity, consistency, isolation, and durability.",
  "SCH-NWPU-007-8c2145": "Precision tells us how many predicted positives are correct, while recall tells us how many actual positives are successfully found.",
};

const summaryOverrides = {
  "SCH-NUDT-006-c43b83": "In short, I would present the problem, my method and contribution, the evidence, and the result.",
  "SCH-TONGJI-006-ef0145": "In short, overfitting is a generalization problem, and we mitigate it with effective data, appropriate regularization, controlled model complexity, and validation-based selection.",
  "SCH-SEU-001-4966ff": "In short, Southeast University matches both my technical interests and my goal of improving research and international communication.",
  "SCH-SEU-002-843060": "In short, I would explain the task, the algorithm's mechanism and complexity, and why it was suitable for the project.",
  "SCH-BUPT-007-d4f9b7": "In short, BUPT is a strong match for my goal of connecting AI research with reliable networked systems.",
  "SCH-NWPU-007-8c2145": "In short, precision focuses on false positives, while recall focuses on false negatives.",
};

function inferTitle(content, index) {
  return titleRules.find(([pattern]) => pattern.test(content))?.[1] ?? fallbackTitles[index] ?? "补充说明";
}

function makeStructure(question) {
  const { answer } = question;
  const sentences = splitSentences(answer.spoken);
  const firstSentence = sentences[0] ?? answer.spoken.trim();
  const directUsesHook = firstSentence.length > 160 && answer.memoryHook.trim().length > 0;
  const direct = directOverrides[question.id] ?? (directUsesHook ? answer.memoryHook.trim() : firstSentence);
  let pointUnits = directUsesHook ? sentences : sentences.slice(1);
  let fromClauses = false;

  if (pointUnits.length < 2) {
    pointUnits = splitClauses(answer.spoken);
    fromClauses = true;
  }
  if (pointUnits.length < 2) pointUnits = [answer.spoken.trim(), answer.memoryHook.trim() || firstSentence];

  const targetCount = fromClauses
    ? Math.min(5, Math.max(2, Math.ceil(pointUnits.length / 2)))
    : Math.min(5, pointUnits.length);
  const grouped = pointUnits.length === targetCount ? pointUnits : groupContiguous(pointUnits, targetCount);
  const summary = summaryOverrides[question.id] ?? (answer.memoryHook.trim() || sentences.at(-1) || firstSentence);

  return {
    direct,
    points: grouped.map((content, index) => ({ title: inferTitle(content, index), content })),
    summary,
  };
}

const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
let changed = 0;
for (const question of dataset.questions) {
  if (question.answer.structure && !shouldForce) continue;
  question.answer.structure = makeStructure(question);
  changed += 1;
}

const invalid = dataset.questions.filter((question) => {
  const structure = question.answer.structure;
  return !structure || !structure.direct || !structure.summary || structure.points.length < 2 || structure.points.length > 5;
});
if (invalid.length > 0) throw new Error(`结构化失败：${invalid.map((question) => question.id).join(", ")}`);

if (shouldWrite) {
  dataset.metadata.generatedAt = new Date().toISOString();
  dataset.metadata.notes = "246 道题已升级为面向保研专业课面试的结构化口述版：先答结论、分点展开、最后收束；原始口述答案、知识解析与记忆钩子继续保留。";
  await writeFile(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
  console.log(`已写入 ${changed} 道结构化答案：${datasetPath}`);
} else {
  console.log(`预览完成：${changed} 道待写入；使用 --write 执行，使用 --force 重建已有结构。`);
}
