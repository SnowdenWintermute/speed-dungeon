import { makeAutoObservable, observable } from "mobx";
import { CombatantClass, NormalizedPercentage } from "@speed-dungeon/common";
import { FULL_ALLOCATION_INTENSITY } from "../analysis-runs/allocation-intensity.ts";
import { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import { AnalysisRunSetOptions } from "../analysis-runs/run-set-worker-messages.ts";
import { DungeonRunAnalysis } from "../analysis-runs/dungeon-run-analysis.ts";
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
  readStoredNumber,
  readStoredString,
} from "./persisted-ui-state.ts";

const DEFAULT_RUN_COUNT = 300;
const MIN_RUN_COUNT = 1;

export class StudyPanelState<AnalysisType extends DungeonRunAnalysis> {
  runCountText = `${DEFAULT_RUN_COUNT}`;
  chosenAllocationIntensity: NormalizedPercentage;
  chosenHonorsEquipmentRequirements = false;
  chosenTargetDummiesHaveArmorClass = false;
  slice: AnalysisSlice = {};
  /** what this study pins rather than leaves to the run controls */
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

    makeAutoObservable<this, "configuration">(this, {
      // selectRooms reads the slice once per sample, of which a run holds millions, so it is held
      // by reference rather than proxied. it is only ever replaced whole, never mutated in place
      slice: observable.ref,
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
    return Number.isInteger(this.runCount) && this.runCount >= MIN_RUN_COUNT;
  }

  get canRun() {
    return (
      this.runCountIsUsable && !this.runSet.isRunning && this.copiedProfiles.blockedReason === null
    );
  }

  /** every goal the study's party holds; a party chasing one thing has nothing to separate */
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
      readStoredNumber(stored.chosenAllocationIntensity) ?? this.chosenAllocationIntensity;
    this.chosenHonorsEquipmentRequirements =
      readStoredBoolean(stored.chosenHonorsEquipmentRequirements) ??
      this.chosenHonorsEquipmentRequirements;
    this.chosenTargetDummiesHaveArmorClass =
      readStoredBoolean(stored.chosenTargetDummiesHaveArmorClass) ??
      this.chosenTargetDummiesHaveArmorClass;
    this.slice = readStoredSlice(stored.slice);
  }
}

/** an omitted dimension means "any", so a stored value that is no longer a member of its enum
 * widens the slice rather than filtering on something no sample can match */
function readStoredSlice(stored: unknown): AnalysisSlice {
  if (!isStoredRecord(stored)) {
    return {};
  }
  const { weaponSpecialty, mainClass, supportClass, goal } = stored;

  return {
    ...(isStoredEnumMember<CharacterWeaponSpecialty>(CharacterWeaponSpecialty, weaponSpecialty)
      ? { weaponSpecialty }
      : {}),
    ...(isStoredEnumMember<CombatantClass>(CombatantClass, mainClass) ? { mainClass } : {}),
    ...(supportClass === null || isStoredEnumMember<CombatantClass>(CombatantClass, supportClass)
      ? { supportClass }
      : {}),
    ...(isStoredEnumMember<AnalysisGoal>(AnalysisGoal, goal) ? { goal } : {}),
  };
}
