import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { invariant } from "@speed-dungeon/common";
import { applyTheme } from "@speed-dungeon/ui/theme";
import { App } from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
invariant(rootElement !== null, "index.html is missing the root element");

// on body rather than the react root, so tooltips portaled to body inherit the variables
applyTheme(document.body, "slate");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
