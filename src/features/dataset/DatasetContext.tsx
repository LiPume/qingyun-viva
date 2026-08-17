import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { VivaDataset } from "../../models/dataset";
import {
  readStoredDataset,
  removeCustomDataset,
  saveCustomDataset,
  type DatasetOrigin,
} from "./storage";
import { validateDataset, validateDefaultDataset } from "./validate";

export interface DatasetImportCandidate {
  dataset: VivaDataset;
  fileName: string;
}

interface DatasetContextValue {
  dataset: VivaDataset | null;
  origin: DatasetOrigin;
  loading: boolean;
  error: string | null;
  warning: string | null;
  reload: () => void;
  prepareImport: (value: unknown, fileName: string) => DatasetImportCandidate;
  activateImport: (candidate: DatasetImportCandidate) => void;
  resetToDefault: () => void;
}

const defaultOrigin: DatasetOrigin = { kind: "default", fileName: "default-dataset.json" };
const DatasetContext = createContext<DatasetContextValue | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<VivaDataset | null>(null);
  const [origin, setOrigin] = useState<DatasetOrigin>(defaultOrigin);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async (attempt: number): Promise<void> => {
      try {
        const stored = readStoredDataset();
        if (stored.status === "valid") {
          if (!active) return;
          setDataset(stored.dataset);
          setOrigin(stored.origin);
          setLoading(false);
          setError(null);
          setWarning(null);
          return;
        }
        const storageWarning = stored.status === "invalid"
          ? `自定义题库无法加载，已回退到内置题库：${stored.message}`
          : null;
        const response = await fetch(`${import.meta.env.BASE_URL}data/default-dataset.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const value = await response.json() as unknown;
        if (!active) return;
        setDataset(validateDefaultDataset(value));
        setOrigin(defaultOrigin);
        setLoading(false);
        setError(null);
        setWarning(storageWarning);
      } catch (reason: unknown) {
        if (!active) return;
        if (attempt < 2) {
          window.setTimeout(() => { if (active) void load(attempt + 1); }, 100 * (attempt + 1));
          return;
        }
        const message = reason instanceof Error ? reason.message : String(reason);
        console.error("Dataset validation failed after 3 attempts:", reason);
        setError(message);
        setLoading(false);
      }
    };
    void load(0);
    return () => { active = false; };
  }, [version]);

  const reload = () => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setVersion((value) => value + 1);
  };

  const prepareImport = (value: unknown, fileName: string): DatasetImportCandidate => ({
    dataset: validateDataset(value),
    fileName,
  });

  const activateImport = (candidate: DatasetImportCandidate) => {
    const nextOrigin = saveCustomDataset(candidate.dataset, candidate.fileName);
    setDataset(candidate.dataset);
    setOrigin(nextOrigin);
    setError(null);
    setWarning(null);
  };

  const resetToDefault = () => {
    removeCustomDataset();
    setOrigin(defaultOrigin);
    reload();
  };

  return (
    <DatasetContext.Provider value={{
      dataset,
      origin,
      loading,
      error,
      warning,
      reload,
      prepareImport,
      activateImport,
      resetToDefault,
    }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset(): DatasetContextValue {
  const context = useContext(DatasetContext);
  if (!context) throw new Error("useDataset must be used inside DatasetProvider");
  return context;
}
