import { ReactElement, useState } from "react";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { UiProvider } from "@speed-dungeon/ui/ui-context";
import { TabBar } from "@speed-dungeon/ui/atoms/TabBar";
import { ZIndexLayers } from "./z-index-layers.ts";
import { BALANCE_TOOLS_TAB_STRINGS, BalanceToolsTab } from "./tabs.ts";
import { StudiesTab } from "./components/studies-tab.tsx";
import { AttainableAttributesTab } from "./attribute-viewer/tab/index.tsx";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

const TAB_OPTIONS = iterateNumericEnumKeyedRecord(BALANCE_TOOLS_TAB_STRINGS).map(
  ([tab, title]) => ({ title, value: tab })
);

const TAB_PANELS: Record<BalanceToolsTab, () => ReactElement> = {
  [BalanceToolsTab.Studies]: StudiesTab,
  [BalanceToolsTab.AttainableAttributes]: AttainableAttributesTab,
};

export function App() {
  const [tab, setTab] = useState(BalanceToolsTab.Studies);
  const Panel = TAB_PANELS[tab];

  return (
    <UiProvider layers={UI_LAYERS}>
      <main className="min-h-screen bg-theme-sunken text-theme-emphasis p-8">
        <h1 className="text-2xl mb-4">Speed Dungeon Balance</h1>

        <TabBar
          title="balance tools sections"
          extraStyles="mb-4"
          value={tab}
          setValue={setTab}
          options={TAB_OPTIONS}
        />

        <Panel />
      </main>
    </UiProvider>
  );
}
