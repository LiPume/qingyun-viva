import rawDataset from "../../../public/data/default-dataset.json";
import { CUSTOM_DATASET_KEY, readStoredDataset, removeCustomDataset, saveCustomDataset } from "./storage";
import { validateDataset } from "./validate";

describe("custom dataset storage", () => {
  beforeEach(() => localStorage.clear());

  it("persists a validated dataset in one versioned envelope", () => {
    const dataset = validateDataset(rawDataset);
    const origin = saveCustomDataset(dataset, "my-dataset.json");
    expect(origin).toMatchObject({ kind: "custom", fileName: "my-dataset.json" });
    const stored = readStoredDataset();
    expect(stored.status).toBe("valid");
    if (stored.status === "valid") {
      expect(stored.dataset.questions).toHaveLength(246);
      expect(stored.origin.fileName).toBe("my-dataset.json");
    }
  });

  it("reports corruption without deleting the stored value", () => {
    localStorage.setItem(CUSTOM_DATASET_KEY, "{broken");
    expect(readStoredDataset()).toMatchObject({ status: "invalid" });
    expect(localStorage.getItem(CUSTOM_DATASET_KEY)).toBe("{broken");
    removeCustomDataset();
    expect(readStoredDataset()).toEqual({ status: "empty" });
  });
});
