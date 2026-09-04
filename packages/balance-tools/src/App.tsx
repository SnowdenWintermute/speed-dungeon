import { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { UiProvider } from "@speed-dungeon/ui/ui-context";
import { TabBar } from "@speed-dungeon/ui/atoms/TabBar";
import { ZIndexLayers } from "./z-index-layers.ts";
import { BALANCE_TOOLS_TAB_STRINGS, BalanceToolsTab } from "./tabs.ts";
import { StudiesTab } from "./components/studies-tab.tsx";
import { AttainableAttributesTab } from "./attribute-viewer/tab/index.tsx";
import { useBalanceToolsApplication } from "./state/context.tsx";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

const TAB_OPTIONS = iterateNumericEnumKeyedRecord(BALANCE_TOOLS_TAB_STRINGS).map(
  ([tab, title]) => ({ title, value: tab })
);

const TAB_PANELS: Record<BalanceToolsTab, FunctionComponent> = {
  [BalanceToolsTab.Studies]: StudiesTab,
  [BalanceToolsTab.AttainableAttributes]: AttainableAttributesTab,
};

export const App = observer(() => {
  const application = useBalanceToolsApplication();
  const Panel = TAB_PANELS[application.tab];

  return (
    <UiProvider layers={UI_LAYERS}>
      <main className="min-h-screen bg-theme-sunken text-theme-emphasis p-8">
        <h1 className="text-2xl mb-4">Speed Dungeon Balance</h1>

        <TabBar
          title="balance tools sections"
          extraStyles="mb-4"
          value={application.tab}
          setValue={(tab) => application.setTab(tab)}
          options={TAB_OPTIONS}
        />

        <Panel />
      </main>
    </UiProvider>
  );
});
