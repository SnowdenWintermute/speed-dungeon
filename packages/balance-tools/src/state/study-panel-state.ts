import { makeAutoObservable, observable, runInAction } from "mobx";
import { CombatantClass, invariant, NormalizedPercentage } from "@speed-dungeon/common";
import { FULL_ALLOCATION_INTENSITY } from "../analysis-runs/allocation-intensity.ts";
import { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import { AnalysisTableRow, StudyTable } from "../analysis-runs/analysis-sample-table.ts";
import { AnalysisRunSetOptions } from "../analysis-runs/run-set-worker-messages.ts";
import {
  fetchSavedRunIntensityPercents,
  intensityPercent,
} from "../analysis-runs/saved-run-paths.ts";
import {
  DungeonRunAnalysis,
  DungeonRunAnalysisResults,
} from "../analysis-runs/dungeon-run-analysis.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import {
  ownAllocationIntensity,
  StudyConfiguration,
  StudyRunControlPins,
} from "../studies/study-configurations.ts";
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
  /** comma separated percents, each walked as its own run set by run all */
  batchIntensitiesText: string;
  /** the run set the table shows */
  shownIntensity: NormalizedPercentage;
  savedIntensityPercents: number[] = [];
  slice: AnalysisSlice = {};
  /** here rather than in the panel component: building one walks every sample, and leaving the
   * tab should not cost that walk again */
  table: null | StudyTable<AnalysisTableRow> = null;
  isBuildingTable = false;
  private tableBuiltFrom: null | DungeonRunAnalysisResults[AnalysisType] = null;
  /** a build that a study switch outran must not land on the run now shown */
  private tableBuildId = 0;
  readonly runControls: StudyRunControlPins;
  /** keyed by percent, since a float key would split one intensity across rounding */
  private readonly runSetsByIntensityPercent = new Map<
    number,
    AnalysisRunSetState<AnalysisType>
  >();
  readonly copiedProfiles: CopiedAttributeProfilesState;

  constructor(
    private readonly studyName: StudyName,
    private readonly analysis: AnalysisType,
    private readonly configuration: StudyConfiguration
  ) {
    const { runControls } = configuration;
    this.runControls = runControls;
    this.chosenAllocationIntensity = ownAllocationIntensity(runControls);
    this.chosenHonorsEquipmentRequirements = runControls.fixedHonorsEquipmentRequirements ?? false;
    this.chosenTargetDummiesHaveArmorClass = runControls.fixedTargetDummiesHaveArmorClass ?? false;
    this.batchIntensitiesText = (runControls.defaultBatchAllocationIntensities ?? [])
      .map(intensityPercent)
      .join(", ");
    this.shownIntensity = this.allocationIntensity;
    this.copiedProfiles = new CopiedAttributeProfilesState(configuration.characterSpecs);

    makeAutoObservable<
      this,
      "configuration" | "tableBuiltFrom" | "tableBuildId" | "studyName" | "analysis"
    >(this, {
      // selectRooms reads the slice once per sample, of which a run holds millions, and a table
      // holds every sample it was built from: proxying either would cost more than it saves. both
      // are only ever replaced whole, never mutated in place
      slice: observable.ref,
      table: observable.ref,
      tableBuiltFrom: observable.ref,
      tableBuildId: false,
      configuration: false,
      runControls: false,
      studyName: false,
      analysis: false,
    });
    this.runSetAt(this.shownIntensity);
  }

  private runSetAt(intensity: NormalizedPercentage) {
    const percent = intensityPercent(intensity);
    const existing = this.runSetsByIntensityPercent.get(percent);
    if (existing !== undefined) {
      return existing;
    }
    const created = new AnalysisRunSetState(this.studyName, this.analysis, percent / 100);
    this.runSetsByIntensityPercent.set(percent, created);
    return created;
  }

  get runSet() {
    const shown = this.runSetsByIntensityPercent.get(intensityPercent(this.shownIntensity));
    invariant(shown !== undefined, "the shown intensity's run set is created when it is shown");
    return shown;
  }

  get runSets() {
    return [...this.runSetsByIntensityPercent.values()];
  }

  get isAnyRunning() {
    return this.runSets.some((runSet) => runSet.isRunning);
  }

  get holdsUnsavedResults() {
    return this.runSets.some((runSet) => runSet.holdsUnsavedResult);
  }

  /** null while the text names anything but whole percents the slider could reach */
  get batchIntensities(): null | NormalizedPercentage[] {
    if (this.runControls.fixedAllocationIntensity !== undefined) {
      return null;
    }
    const entries = this.batchIntensitiesText.split(",").map((entry) => entry.trim());
    const percents = entries.filter((entry) => entry !== "").map(Number);
    const isUsable =
      percents.length > 0 &&
      percents.every((percent) => Number.isInteger(percent) && percent >= 0 && percent <= 100);

    return isUsable ? [...new Set(percents)].map((percent) => percent / 100) : null;
  }

  /** every intensity with a run held in memory or saved to disk, so either can be shown */
  get showableIntensityPercents() {
    const held = this.runSets
      .filter((runSet) => runSet.result !== null || runSet.isRunning)
      .map((runSet) => intensityPercent(runSet.intensity));
    return [...new Set([...held, ...this.savedIntensityPercents])].sort((a, b) => a - b);
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
      this.runCountIsUsable && !this.isAnyRunning && this.copiedProfiles.blockedReason === null
    );
  }

  get canRunBatch() {
    return this.canRun && this.batchIntensities !== null;
  }

  get goalsInParty() {
    return [...new Set(this.configuration.characterSpecs.map((spec) => spec.goal))];
  }

  get runSetControls(): Omit<AnalysisRunSetOptions, "allocationIntensity"> {
    return {
      runCount: this.runCount,
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

  setBatchIntensitiesText(batchIntensitiesText: string) {
    this.batchIntensitiesText = batchIntensitiesText;
  }

  /** a run set never shown before reads its saved run, if one exists */
  showIntensity(intensity: NormalizedPercentage) {
    const runSet = this.runSetAt(intensity);
    this.shownIntensity = intensity;
    if (runSet.result === null && !runSet.isRunning && !runSet.isLoadingSavedRun) {
      runSet.loadSavedRun();
    }
  }

  async refreshSavedIntensities() {
    const percents = await fetchSavedRunIntensityPercents(this.studyName);
    runInAction(() => {
      this.savedIntensityPercents = percents;
    });
  }

  loadSavedRuns() {
    this.refreshSavedIntensities();
    this.showIntensity(this.shownIntensity);
  }

  runIfPossible() {
    const { readyCharacterSpecs } = this.copiedProfiles;
    if (!this.canRun || readyCharacterSpecs === null) {
      return;
    }
    this.runSetAt(this.allocationIntensity).run(readyCharacterSpecs, this.runSetControls);
    this.shownIntensity = this.allocationIntensity;
  }

  runBatchIfPossible() {
    const { readyCharacterSpecs } = this.copiedProfiles;
    const { batchIntensities } = this;
    if (!this.canRunBatch || readyCharacterSpecs === null || batchIntensities === null) {
      return;
    }
    for (const intensity of batchIntensities) {
      this.runSetAt(intensity).run(readyCharacterSpecs, this.runSetControls);
    }
    const [firstIntensity] = batchIntensities;
    if (firstIntensity !== undefined) {
      this.shownIntensity = firstIntensity;
    }
  }

  async saveShown() {
    const written = await this.runSet.save();
    await this.refreshSavedIntensities();
    return written;
  }

  async saveAll() {
    const written: string[] = [];
    for (const runSet of this.runSets.filter((held) => held.holdsUnsavedResult)) {
      written.push(await runSet.save());
    }
    await this.refreshSavedIntensities();
    return written.join(", ");
  }

  /** the build blocks, so it is queued behind the render that puts the spinner up */
  buildTableIfNeeded(
    tableConstructor: new (
      result: DungeonRunAnalysisResults[AnalysisType]
    ) => StudyTable<AnalysisTableRow>
  ) {
    const { result } = this.runSet;
    if (result === this.tableBuiltFrom || this.isBuildingTable) {
      return;
    }
    if (result === null) {
      this.table = null;
      this.tableBuiltFrom = null;
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

  /** a result is large enough that only the shown intensity's empty run set is kept */
  clear() {
    for (const runSet of this.runSets) {
      runSet.clear();
    }
    this.runSetsByIntensityPercent.clear();
    this.runSetAt(this.shownIntensity);
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
      batchIntensitiesText: this.batchIntensitiesText,
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
    this.batchIntensitiesText =
      readStoredString(stored.batchIntensitiesText) ?? this.batchIntensitiesText;
    this.slice = this.readStoredSlice(stored.slice);
    // restored before any saved run is read, so the shown run follows the restored slider
    this.shownIntensity = this.allocationIntensity;
    this.runSetAt(this.shownIntensity);
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
