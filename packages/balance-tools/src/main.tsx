import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { invariant } from "@speed-dungeon/common";
import { applyTheme } from "@speed-dungeon/ui/theme";
import { App } from "./App.tsx";
import { BalanceToolsApplication } from "./state/balance-tools-application.ts";
import { BalanceToolsApplicationProvider } from "./state/context.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
invariant(rootElement !== null, "index.html is missing the root element");

// on body rather than the react root, so tooltips portaled to body inherit the variables
applyTheme(document.body, "slate");

// built outside react, so StrictMode's double invocation cannot restore or initialize it twice
const application = new BalanceToolsApplication();
application.initialize();

createRoot(rootElement).render(
  <StrictMode>
    <BalanceToolsApplicationProvider application={application}>
      <App />
    </BalanceToolsApplicationProvider>
  </StrictMode>
);
