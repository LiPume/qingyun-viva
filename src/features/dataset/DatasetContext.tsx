import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { VivaDataset } from "../../models/dataset";
import { validateDataset } from "./validate";

interface DatasetContextValue {
  dataset: VivaDataset | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<VivaDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async (attempt: number): Promise<void> => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/default-dataset.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const value = await response.json() as unknown;
        if (!active) return;
        setDataset(validateDataset(value));
        setLoading(false);
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
    setVersion((value) => value + 1);
  };

  return (
    <DatasetContext.Provider value={{ dataset, loading, error, reload }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset(): DatasetContextValue {
  const context = useContext(DatasetContext);
  if (!context) throw new Error("useDataset must be used inside DatasetProvider");
  return context;
}
