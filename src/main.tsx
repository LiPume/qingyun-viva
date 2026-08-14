import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./app/App";
import { DatasetProvider } from "./features/dataset/DatasetContext";
import { AppStateProvider } from "./features/training/AppStateContext";
import "./styles/main.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <DatasetProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </DatasetProvider>
    </HashRouter>
  </StrictMode>,
);
