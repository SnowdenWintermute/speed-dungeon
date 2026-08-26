import { ReactElement, useState } from "react";
import { iterateNumericEnum } from "@speed-dungeon/common";
import { UiProvider } from "@speed-dungeon/ui/ui-context";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { ZIndexLayers } from "./z-index-layers";
import { DUNGEON_RUN_ANALYSIS_NAMES, DungeonRunAnalysis } from "./analysis-runs/types";
import { MaxAccuracyPanel } from "./studies/max-accuracy/panel";
import { AttackDamagePanel } from "./studies/attack-damage/panel";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

const ANALYSIS_OPTIONS = iterateNumericEnum(DungeonRunAnalysis).map((analysis) => ({
  title: DUNGEON_RUN_ANALYSIS_NAMES[analysis],
  value: analysis,
}));

const ANALYSIS_PANELS: Record<DungeonRunAnalysis, () => ReactElement> = {
  [DungeonRunAnalysis.MaxAccuracy]: MaxAccuracyPanel,
  [DungeonRunAnalysis.AttackDamage]: AttackDamagePanel,
};

export function App() {
  const [analysis, setAnalysis] = useState(DungeonRunAnalysis.AttackDamage);
  const Panel = ANALYSIS_PANELS[analysis];

  return (
    <UiProvider layers={UI_LAYERS}>
      <main className="min-h-screen bg-theme-sunken text-theme-emphasis p-8">
        <h1 className="text-2xl mb-4">Speed Dungeon Balance</h1>

        <div className="mb-4">
          <span className="block mb-1 text-theme-muted">Study</span>
          <RadioGroup
            title="Study"
            value={analysis}
            setValue={setAnalysis}
            options={ANALYSIS_OPTIONS}
          />
        </div>

        <Panel />
      </main>
    </UiProvider>
  );
}
