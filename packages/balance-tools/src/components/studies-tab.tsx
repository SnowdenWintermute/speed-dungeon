import { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";
import { iterateNumericEnum } from "@speed-dungeon/common";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { STUDY_NAME_SLUGS, StudyName } from "../studies/study-name.ts";
import { MaxAccuracyPanel } from "../studies/max-accuracy/panel.tsx";
import { SampledDamagePanel } from "../studies/sampled-damage/panel.tsx";
import { ArmorClassPanel } from "../studies/armor-class/panel.tsx";
import { MaxSpeedPanel } from "../studies/max-speed/panel.tsx";
import { useBalanceToolsApplication } from "../state/context.tsx";

const STUDY_OPTIONS = iterateNumericEnum(StudyName).map((studyName) => ({
  title: STUDY_NAME_SLUGS[studyName],
  value: studyName,
}));

const STUDY_PANELS: Record<StudyName, FunctionComponent> = {
  [StudyName.MaxAccuracyMixed]: MaxAccuracyPanel,
  [StudyName.AttackDamageGroupOne]: () => SampledDamagePanel(StudyName.AttackDamageGroupOne),
  [StudyName.CasterDamageMixed]: () => SampledDamagePanel(StudyName.CasterDamageMixed),
  [StudyName.MixedDamageGroupThree]: () => SampledDamagePanel(StudyName.MixedDamageGroupThree),
  [StudyName.CasterDualWieldRanged]: () => SampledDamagePanel(StudyName.CasterDualWieldRanged),
  [StudyName.ArmorClassMixed]: () => ArmorClassPanel(StudyName.ArmorClassMixed),
  [StudyName.ArmorClassGroupThree]: () => ArmorClassPanel(StudyName.ArmorClassGroupThree),
  [StudyName.MaxSpeedMixed]: MaxSpeedPanel,
};

export const StudiesTab = observer(() => {
  const { studies } = useBalanceToolsApplication();
  const Panel = STUDY_PANELS[studies.studyName];

  return (
    <div>
      <div className="mb-4">
        <span className="block mb-1 text-theme-muted">Study</span>
        <RadioGroup
          title="Study"
          value={studies.studyName}
          setValue={(studyName) => studies.setStudyName(studyName)}
          options={STUDY_OPTIONS}
        />
      </div>

      <Panel />
    </div>
  );
});
