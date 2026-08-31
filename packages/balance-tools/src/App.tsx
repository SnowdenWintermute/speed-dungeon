import { ReactElement, useState } from "react";
import { iterateNumericEnum } from "@speed-dungeon/common";
import { UiProvider } from "@speed-dungeon/ui/ui-context";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { ZIndexLayers } from "./z-index-layers.ts";
import { STUDY_NAME_SLUGS, StudyName } from "./studies/study-name.ts";
import { MaxAccuracyPanel } from "./studies/max-accuracy/panel.tsx";
import { SampledDamagePanel } from "./studies/sampled-damage/panel.tsx";
import { ArmorClassPanel } from "./studies/armor-class/panel.tsx";
import { MaxSpeedPanel } from "./studies/max-speed/panel.tsx";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

const STUDY_OPTIONS = iterateNumericEnum(StudyName).map((studyName) => ({
  title: STUDY_NAME_SLUGS[studyName],
  value: studyName,
}));

const STUDY_PANELS: Record<StudyName, () => ReactElement> = {
  [StudyName.MaxAccuracyMixed]: MaxAccuracyPanel,
  [StudyName.AttackDamageGroupOne]: () => SampledDamagePanel(StudyName.AttackDamageGroupOne),
  [StudyName.CasterDamageMixed]: () => SampledDamagePanel(StudyName.CasterDamageMixed),
  [StudyName.MixedDamageGroupThree]: () => SampledDamagePanel(StudyName.MixedDamageGroupThree),
  [StudyName.CasterDualWieldRanged]: () => SampledDamagePanel(StudyName.CasterDualWieldRanged),
  [StudyName.ArmorClassMixed]: () => ArmorClassPanel(StudyName.ArmorClassMixed),
  [StudyName.ArmorClassGroupThree]: () => ArmorClassPanel(StudyName.ArmorClassGroupThree),
  [StudyName.MaxSpeedMixed]: MaxSpeedPanel,
};

export function App() {
  const [studyName, setStudyName] = useState(StudyName.AttackDamageGroupOne);
  const Panel = STUDY_PANELS[studyName];

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

        <Panel />
      </main>
    </UiProvider>
  );
}
