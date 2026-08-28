import { ReactElement, useState } from "react";
import { iterateNumericEnum } from "@speed-dungeon/common";
import { UiProvider } from "@speed-dungeon/ui/ui-context";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { ZIndexLayers } from "./z-index-layers";
import { DungeonRunAnalysis } from "./analysis-runs/dungeon-run-analysis";
import { STUDY_ANALYSES, STUDY_NAME_SLUGS, StudyName } from "./studies/study-name";
import { MaxAccuracyPanel } from "./studies/max-accuracy/panel";
import { AttackDamagePanel } from "./studies/attack-damage/panel";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

const STUDY_OPTIONS = iterateNumericEnum(StudyName).map((studyName) => ({
  title: STUDY_NAME_SLUGS[studyName],
  value: studyName,
}));

const ANALYSIS_PANELS: Record<
  DungeonRunAnalysis,
  (props: { studyName: StudyName }) => ReactElement
> = {
  [DungeonRunAnalysis.MaxAccuracy]: MaxAccuracyPanel,
  [DungeonRunAnalysis.AttackDamage]: AttackDamagePanel,
};

export function App() {
  const [studyName, setStudyName] = useState(StudyName.AttackDamageMixed);
  const Panel = ANALYSIS_PANELS[STUDY_ANALYSES[studyName]];

  return (
    <UiProvider layers={UI_LAYERS}>
      <main className="min-h-screen bg-theme-sunken text-theme-emphasis p-8">
        <h1 className="text-2xl mb-4">Speed Dungeon Balance</h1>

        <div className="mb-4">
          <span className="block mb-1 text-theme-muted">Study</span>
          <RadioGroup
            title="Study"
            value={studyName}
            setValue={setStudyName}
            options={STUDY_OPTIONS}
          />
        </div>

        <Panel studyName={studyName} />
      </main>
    </UiProvider>
  );
}
