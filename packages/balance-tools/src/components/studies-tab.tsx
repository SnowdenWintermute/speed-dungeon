import { ReactElement, useState } from "react";
import { iterateNumericEnum } from "@speed-dungeon/common";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { STUDY_NAME_SLUGS, StudyName } from "../studies/study-name.ts";
import { MaxAccuracyPanel } from "../studies/max-accuracy/panel.tsx";
import { SampledDamagePanel } from "../studies/sampled-damage/panel.tsx";
import { ArmorClassPanel } from "../studies/armor-class/panel.tsx";
import { MaxSpeedPanel } from "../studies/max-speed/panel.tsx";

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

export function StudiesTab() {
  const [studyName, setStudyName] = useState(StudyName.AttackDamageGroupOne);
  const Panel = STUDY_PANELS[studyName];

  return (
    <div>
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
    </div>
  );
}
