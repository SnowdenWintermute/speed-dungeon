import { makeAutoObservable, reaction } from "mobx";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import {
  AnalysisOfStudy,
  STUDY_ANALYSES,
  STUDY_NAME_SLUGS,
  StudyName,
} from "../studies/study-name.ts";
import { STUDY_CONFIGURATIONS } from "../studies/study-configurations.ts";
import {
  isStoredEnumMember,
  isStoredRecord,
  PersistedStudiesTabState,
  PersistedStudyPanelState,
} from "./persisted-ui-state.ts";
import { StudyPanelState } from "./study-panel-state.ts";

type StudyPanelStates = { [TStudy in StudyName]: StudyPanelState<AnalysisOfStudy<TStudy>> };

type AnyStudyPanelState = StudyPanelStates[StudyName];

function panelStateFor<TStudy extends StudyName>(
  studyName: TStudy
): StudyPanelState<AnalysisOfStudy<TStudy>> {
  return new StudyPanelState(studyName, STUDY_ANALYSES[studyName], STUDY_CONFIGURATIONS[studyName]);
}

/** a Record so a study without a panel state is a compile error rather than a lookup miss */
function studyPanelStates(): StudyPanelStates {
  return {
    [StudyName.MaxAccuracyMixed]: panelStateFor(StudyName.MaxAccuracyMixed),
    [StudyName.AttackDamageGroupOne]: panelStateFor(StudyName.AttackDamageGroupOne),
    [StudyName.CasterDamageMixed]: panelStateFor(StudyName.CasterDamageMixed),
    [StudyName.MixedDamageGroupThree]: panelStateFor(StudyName.MixedDamageGroupThree),
    [StudyName.CasterDualWieldRanged]: panelStateFor(StudyName.CasterDualWieldRanged),
    [StudyName.ArmorClassMixed]: panelStateFor(StudyName.ArmorClassMixed),
    [StudyName.ArmorClassGroupThree]: panelStateFor(StudyName.ArmorClassGroupThree),
    [StudyName.MaxSpeedMixed]: panelStateFor(StudyName.MaxSpeedMixed),
  };
}

export class StudiesTabState {
  studyName = StudyName.AttackDamageGroupOne;
  private readonly panels = studyPanelStates();

  constructor() {
    makeAutoObservable<this, "panels">(this, { panels: false });
  }

  panelFor<TStudy extends StudyName>(studyName: TStudy) {
    return this.panels[studyName];
  }

  setStudyName(studyName: StudyName) {
    this.studyName = studyName;
  }

  /** firing immediately means a study restored from storage takes the same path as one just
   * chosen, so there is no separate hydration branch to keep in step with this one */
  initialize() {
    reaction(
      () => this.studyName,
      (studyName, previousStudyName) => {
        if (previousStudyName !== undefined) {
          // a result and its table are large enough that keeping the ones walked earlier would
          // cost more memory than the tool has to spend
          this.panels[previousStudyName].clear();
        }
        const panel = this.panels[studyName];
        panel.runSet.loadSavedRun();
        panel.copiedProfiles.read();
      },
      { fireImmediately: true }
    );
  }

  toSerialized(): PersistedStudiesTabState {
    const panelsByStudy: Record<string, PersistedStudyPanelState> = {};
    for (const [studyName, panel] of iterateNumericEnumKeyedRecord<StudyName, AnyStudyPanelState>(
      this.panels
    )) {
      panelsByStudy[STUDY_NAME_SLUGS[studyName]] = panel.toSerialized();
    }

    return { studyName: this.studyName, panelsByStudy };
  }

  applySerialized(stored: unknown) {
    if (!isStoredRecord(stored)) {
      return;
    }
    if (isStoredEnumMember<StudyName>(StudyName, stored.studyName)) {
      this.studyName = stored.studyName;
    }
    const { panelsByStudy } = stored;
    if (!isStoredRecord(panelsByStudy)) {
      return;
    }
    for (const [studyName, panel] of iterateNumericEnumKeyedRecord<StudyName, AnyStudyPanelState>(
      this.panels
    )) {
      panel.applySerialized(panelsByStudy[STUDY_NAME_SLUGS[studyName]]);
    }
  }
}
