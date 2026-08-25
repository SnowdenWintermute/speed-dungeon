import { ReactElement, useState } from "react";
import { iterateNumericEnum } from "@speed-dungeon/common";
import { UiProvider } from "@speed-dungeon/ui/ui-context";
import { SelectDropdown } from "@speed-dungeon/ui/atoms/SelectDropdown";
import {
  DUNGEON_RUN_ANALYSIS_NAMES,
  DungeonRunAnalysis,
} from "./analysis-runs/dungeon-run-analysis";
import { AttackDamagePanel } from "./studies/attack-damage/Panel";
import { MaxAccuracyPanel } from "./studies/max-accuracy/Panel";
import { ZIndexLayers } from "./z-index-layers";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

const ANALYSIS_OPTIONS = iterateNumericEnum(DungeonRunAnalysis).map((analysis) => ({
  title: DUNGEON_RUN_ANALYSIS_NAMES[analysis],
  value: analysis,
}));

// mounting only the selected study keeps a single worker in flight, and drops the other's table
const ANALYSIS_PANELS: Record<DungeonRunAnalysis, () => ReactElement> = {
  [DungeonRunAnalysis.AttackDamage]: AttackDamagePanel,
  [DungeonRunAnalysis.MaxAccuracy]: MaxAccuracyPanel,
};

export function App() {
  const [analysis, setAnalysis] = useState(DungeonRunAnalysis.AttackDamage);
  const Panel = ANALYSIS_PANELS[analysis];

  return (
    <UiProvider layers={UI_LAYERS}>
      <main className="min-h-screen bg-theme-recessed text-theme-emphasis p-8">
        <h1 className="text-2xl mb-4">Speed Dungeon Balance</h1>

        <label className="flex flex-col w-52 mb-4">
          <span className="text-theme-muted">Study</span>
          <SelectDropdown
            title="Study"
            value={analysis}
            setValue={setAnalysis}
            options={ANALYSIS_OPTIONS}
            disabled={false}
          />
        </label>

        <Panel />
      </main>
    </UiProvider>
  );
}
