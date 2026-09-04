import { FunctionComponent, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { RadioGroup } from "@speed-dungeon/ui/atoms/RadioGroup";
import { STUDY_NAME_SLUGS, StudyName } from "../studies/study-name.ts";
import { MaxAccuracyPanel } from "../studies/max-accuracy/panel.tsx";
import { SampledDamagePanel } from "../studies/sampled-damage/panel.tsx";
import { ArmorClassPanel } from "../studies/armor-class/panel.tsx";
import { MaxSpeedPanel } from "../studies/max-speed/panel.tsx";
import { useBalanceToolsApplication } from "../state/context.tsx";

function studyRadioOption(studyName: StudyName) {
  return { value: studyName, title: STUDY_NAME_SLUGS[studyName] };
}

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
        <div className="flex">
          <StudySelectionGroup title="Attributes">
            <RadioGroup
              title="Study"
              value={studies.studyName}
              setValue={(studyName) => studies.setStudyName(studyName)}
              options={[
                studyRadioOption(StudyName.MaxAccuracyMixed),
                studyRadioOption(StudyName.MaxSpeedMixed),
              ]}
            />
          </StudySelectionGroup>
          <StudySelectionGroup title="Damage">
            <RadioGroup
              title="Study"
              value={studies.studyName}
              setValue={(studyName) => studies.setStudyName(studyName)}
              options={[
                studyRadioOption(StudyName.AttackDamageGroupOne),
                studyRadioOption(StudyName.CasterDamageMixed),
                studyRadioOption(StudyName.CasterDualWieldRanged),
                studyRadioOption(StudyName.MixedDamageGroupThree),
              ]}
            />
          </StudySelectionGroup>

          <StudySelectionGroup title="Armor">
            <RadioGroup
              title="Study"
              value={studies.studyName}
              setValue={(studyName) => studies.setStudyName(studyName)}
              options={[
                studyRadioOption(StudyName.ArmorClassMixed),
                studyRadioOption(StudyName.ArmorClassGroupThree),
              ]}
            />
          </StudySelectionGroup>
        </div>
      </div>

      <Panel />
    </div>
  );
});

function StudySelectionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-r-0 last:border-r border-theme-muted px-4 py-2 text-theme-muted">
      <div>{title}</div>
      {children}
    </div>
  );
}
