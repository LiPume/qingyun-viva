import type { VivaDataset } from "../../models/dataset";
import { validateDataset } from "./validate";

export const CUSTOM_DATASET_KEY = "qingyun-viva:dataset:v1";
export const MAX_DATASET_FILE_BYTES = 4 * 1024 * 1024;

export interface DatasetOrigin {
  kind: "default" | "custom";
  fileName: string;
  importedAt?: string;
}

interface StoredDatasetEnvelope {
  storageVersion: 1;
  fileName: string;
  importedAt: string;
  dataset: VivaDataset;
}

export type StoredDatasetResult =
  | { status: "empty" }
  | { status: "valid"; dataset: VivaDataset; origin: DatasetOrigin }
  | { status: "invalid"; message: string };

export function readStoredDataset(): StoredDatasetResult {
  const raw = localStorage.getItem(CUSTOM_DATASET_KEY);
  if (!raw) return { status: "empty" };
  try {
    const envelope = JSON.parse(raw) as Partial<StoredDatasetEnvelope>;
    if (envelope.storageVersion !== 1 || typeof envelope.fileName !== "string" || typeof envelope.importedAt !== "string") {
      throw new Error("本地题库版本或元数据不受支持");
    }
    if (Number.isNaN(Date.parse(envelope.importedAt))) throw new Error("本地题库导入时间无效");
    return {
      status: "valid",
      dataset: validateDataset(envelope.dataset),
      origin: { kind: "custom", fileName: envelope.fileName, importedAt: envelope.importedAt },
    };
  } catch (error) {
    return {
      status: "invalid",
      message: error instanceof Error ? error.message : "本地题库无法解析",
    };
  }
}

export function saveCustomDataset(dataset: VivaDataset, fileName: string): DatasetOrigin {
  const importedAt = new Date().toISOString();
  const envelope: StoredDatasetEnvelope = {
    storageVersion: 1,
    fileName,
    importedAt,
    dataset,
  };
  try {
    localStorage.setItem(CUSTOM_DATASET_KEY, JSON.stringify(envelope));
  } catch (error) {
    throw new Error(error instanceof DOMException && error.name === "QuotaExceededError"
      ? "浏览器本地空间不足，题库未被替换。请缩小 JSON 文件后重试。"
      : "自定义题库无法写入当前浏览器，原题库仍然保留。", { cause: error });
  }
  return { kind: "custom", fileName, importedAt };
}

export function removeCustomDataset(): void {
  localStorage.removeItem(CUSTOM_DATASET_KEY);
}
