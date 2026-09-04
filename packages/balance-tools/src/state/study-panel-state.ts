import { makeAutoObservable, observable, runInAction } from "mobx";
import { CombatantClass, NormalizedPercentage } from "@speed-dungeon/common";
import { FULL_ALLOCATION_INTENSITY } from "../analysis-runs/allocation-intensity.ts";
import { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import { AnalysisTableRow, StudyTable } from "../analysis-runs/analysis-sample-table.ts";
import { AnalysisRunSetOptions } from "../analysis-runs/run-set-worker-messages.ts";
import {
  DungeonRunAnalysis,
  DungeonRunAnalysisResults,
} from "../analysis-runs/dungeon-run-analysis.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import { StudyConfiguration, StudyRunControlPins } from "../studies/study-configurations.ts";
import { StudyName } from "../studies/study-name.ts";
import { AnalysisRunSetState } from "./analysis-run-set-state.ts";
import { CopiedAttributeProfilesState } from "./copied-attribute-profiles-state.ts";
import {
  isStoredEnumMember,
  isStoredRecord,
  PersistedStudyPanelState,
  readStoredBoolean,
  readStoredNumberInRange,
  readStoredString,
} from "./persisted-ui-state.ts";

const DEFAULT_RUN_COUNT = 300;
export const MIN_RUN_COUNT = 1;
export const MAX_RUN_COUNT = 2000;

export class StudyPanelState<AnalysisType extends DungeonRunAnalysis> {
  runCountText = `${DEFAULT_RUN_COUNT}`;
  chosenAllocationIntensity: NormalizedPercentage;
  chosenHonorsEquipmentRequirements = false;
  chosenTargetDummiesHaveArmorClass = false;
  slice: AnalysisSlice = {};
  /** here rather than in the panel component: building one walks every sample, and leaving the
   * tab should not cost that walk again */
  table: null | StudyTable<AnalysisTableRow> = null;
  isBuildingTable = false;
  private tableBuiltFrom: null | DungeonRunAnalysisResults[AnalysisType] = null;
  /** a build that a study switch outran must not land on the run now shown */
  private tableBuildId = 0;
  readonly runControls: StudyRunControlPins;
  readonly runSet: AnalysisRunSetState<AnalysisType>;
  readonly copiedProfiles: CopiedAttributeProfilesState;

  constructor(
    studyName: StudyName,
    analysis: AnalysisType,
    private readonly configuration: StudyConfiguration
  ) {
    const { runControls } = configuration;
    this.runControls = runControls;
    this.chosenAllocationIntensity =
      runControls.fixedAllocationIntensity ??
      runControls.defaultAllocationIntensity ??
      FULL_ALLOCATION_INTENSITY;
    this.chosenHonorsEquipmentRequirements = runControls.fixedHonorsEquipmentRequirements ?? false;
    this.chosenTargetDummiesHaveArmorClass = runControls.fixedTargetDummiesHaveArmorClass ?? false;
    this.runSet = new AnalysisRunSetState(studyName, analysis);
    this.copiedProfiles = new CopiedAttributeProfilesState(configuration.characterSpecs);

    makeAutoObservable<this, "configuration" | "tableBuiltFrom" | "tableBuildId">(this, {
      // selectRooms reads the slice once per sample, of which a run holds millions, and a table
      // holds every sample it was built from: proxying either would cost more than it saves. both
      // are only ever replaced whole, never mutated in place
      slice: observable.ref,
      table: observable.ref,
      tableBuiltFrom: observable.ref,
      tableBuildId: false,
      configuration: false,
      runControls: false,
    });
  }

  // a study can pin a control to one value, in which case what the user last chose stops counting
  get allocationIntensity() {
    return this.runControls.fixedAllocationIntensity ?? this.chosenAllocationIntensity;
  }

  get honorsEquipmentRequirements() {
    return (
      this.runControls.fixedHonorsEquipmentRequirements ?? this.chosenHonorsEquipmentRequirements
    );
  }

  get targetDummiesHaveArmorClass() {
    return (
      this.runControls.fixedTargetDummiesHaveArmorClass ?? this.chosenTargetDummiesHaveArmorClass
    );
  }

  get runCount() {
    return Number(this.runCountText);
  }

  get runCountIsUsable() {
    return (
      Number.isInteger(this.runCount) &&
      this.runCount >= MIN_RUN_COUNT &&
      this.runCount <= MAX_RUN_COUNT
    );
  }

  get canRun() {
    return (
      this.runCountIsUsable && !this.runSet.isRunning && this.copiedProfiles.blockedReason === null
    );
  }

  get goalsInParty() {
    return [...new Set(this.configuration.characterSpecs.map((spec) => spec.goal))];
  }

  get runSetOptions(): AnalysisRunSetOptions {
    return {
      runCount: this.runCount,
      allocationIntensity: this.allocationIntensity,
      honorsEquipmentRequirements: this.honorsEquipmentRequirements,
      targetDummiesHaveArmorClass: this.targetDummiesHaveArmorClass,
    };
  }

  setRunCountText(runCountText: string) {
    this.runCountText = runCountText;
  }

  setChosenAllocationIntensity(allocationIntensity: NormalizedPercentage) {
    this.chosenAllocationIntensity = allocationIntensity;
  }

  setChosenHonorsEquipmentRequirements(honorsEquipmentRequirements: boolean) {
    this.chosenHonorsEquipmentRequirements = honorsEquipmentRequirements;
  }

  setChosenTargetDummiesHaveArmorClass(targetDummiesHaveArmorClass: boolean) {
    this.chosenTargetDummiesHaveArmorClass = targetDummiesHaveArmorClass;
  }

  setSlice(slice: AnalysisSlice) {
    this.slice = slice;
  }

  runIfPossible() {
    const { readyCharacterSpecs } = this.copiedProfiles;
    if (!this.canRun || readyCharacterSpecs === null) {
      return;
    }
    this.runSet.run(readyCharacterSpecs, this.runSetOptions);
  }

  /** the build blocks, so it is queued behind the render that puts the spinner up */
  buildTableIfNeeded(
    tableConstructor: new (
      result: DungeonRunAnalysisResults[AnalysisType]
    ) => StudyTable<AnalysisTableRow>
  ) {
    const { result } = this.runSet;
    if (result === null || result === this.tableBuiltFrom || this.isBuildingTable) {
      return;
    }
    // a table built from a replaced result describes a run nobody is looking at
    this.table = null;
    this.tableBuiltFrom = null;
    this.isBuildingTable = true;
    this.tableBuildId++;
    const buildId = this.tableBuildId;

    setTimeout(() => {
      if (buildId !== this.tableBuildId) {
        return;
      }
      // read again rather than closed over: a run may have finished in the meantime
      const current = this.runSet.result;
      runInAction(() => {
        this.table = current === null ? null : new tableConstructor(current);
        this.tableBuiltFrom = current;
        this.isBuildingTable = false;
      });
    }, 0);
  }

  clear() {
    this.runSet.clear();
    this.tableBuildId++;
    this.table = null;
    this.tableBuiltFrom = null;
    this.isBuildingTable = false;
  }

  toSerialized(): PersistedStudyPanelState {
    return {
      runCountText: this.runCountText,
      chosenAllocationIntensity: this.chosenAllocationIntensity,
      chosenHonorsEquipmentRequirements: this.chosenHonorsEquipmentRequirements,
      chosenTargetDummiesHaveArmorClass: this.chosenTargetDummiesHaveArmorClass,
      slice: this.slice,
    };
  }

  applySerialized(stored: unknown) {
    if (!isStoredRecord(stored)) {
      return;
    }
    this.runCountText = readStoredString(stored.runCountText) ?? this.runCountText;
    this.chosenAllocationIntensity =
      readStoredNumberInRange(stored.chosenAllocationIntensity, 0, FULL_ALLOCATION_INTENSITY) ??
      this.chosenAllocationIntensity;
    this.chosenHonorsEquipmentRequirements =
      readStoredBoolean(stored.chosenHonorsEquipmentRequirements) ??
      this.chosenHonorsEquipmentRequirements;
    this.chosenTargetDummiesHaveArmorClass =
      readStoredBoolean(stored.chosenTargetDummiesHaveArmorClass) ??
      this.chosenTargetDummiesHaveArmorClass;
    this.slice = this.readStoredSlice(stored.slice);
  }

  /** a stored value this study can no longer show a control for widens the slice rather than
   * filtering on something no sample of its can match */
  private readStoredSlice(stored: unknown): AnalysisSlice {
    if (!isStoredRecord(stored)) {
      return {};
    }
    const { weaponSpecialty, mainClass, supportClass, goal } = stored;
    // the goal control is only drawn for a party chasing more than one, so a goal this party no
    // longer holds would filter every sample out with nothing on screen to clear it
    const holdsGoal =
      isStoredEnumMember<AnalysisGoal>(AnalysisGoal, goal) &&
      this.goalsInParty.length > 1 &&
      this.goalsInParty.includes(goal);

    return {
      ...(isStoredEnumMember<CharacterWeaponSpecialty>(CharacterWeaponSpecialty, weaponSpecialty)
        ? { weaponSpecialty }
        : {}),
      ...(isStoredEnumMember<CombatantClass>(CombatantClass, mainClass) ? { mainClass } : {}),
      ...(supportClass === null || isStoredEnumMember<CombatantClass>(CombatantClass, supportClass)
        ? { supportClass }
        : {}),
      ...(holdsGoal ? { goal } : {}),
    };
  }
}
