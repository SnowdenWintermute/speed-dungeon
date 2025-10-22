import { Option } from "../primatives/option.js";
import { CombatActionName, FriendOrFoe, TargetingScheme } from "../combat/combat-actions/index.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import { EntityId, NextOrPrevious } from "../primatives/index.js";
import { SpeedDungeonPlayer } from "../game/player.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";
import getNextOrPreviousTarget from "../combat/targeting/get-next-or-previous-target.js";
import { TargetingCalculator } from "../combat/targeting/targeting-calculator.js";
import { makeAutoObservable } from "mobx";
import { plainToInstance } from "class-transformer";
import { runIfInBrowser } from "../utils/index.js";

export class ActionAndRank {
  constructor(
    public actionName: CombatActionName,
    public rank: number
  ) {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }
}

export class ActionUserTargetingProperties {
  private selectedActionAndRank: Option<ActionAndRank> = null;
  private selectedTarget: Option<CombatActionTarget> = null;
  private selectedTargetingScheme: Option<TargetingScheme> = null;
  private selectedItemId: Option<EntityId> = null;

  constructor() {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  static getDeserialized(actionUserTargetingProperties: ActionUserTargetingProperties) {
    return plainToInstance(ActionUserTargetingProperties, actionUserTargetingProperties);
  }

  clear() {
    this.selectedActionAndRank = null;
    this.selectedTarget = null;
    this.selectedTargetingScheme = null;
    this.selectedItemId = null;
  }

  // Useful for working with immer/zustand. Allows us to use setters
  // to modify and object and then replace the whole object so react can
  // rerender its properties
  clone(): ActionUserTargetingProperties {
    const copy = new ActionUserTargetingProperties();
    Object.assign(copy, this);
    return copy;
  }

  getSelectedActionAndRank() {
    return this.selectedActionAndRank;
  }
  getSelectedTarget() {
    return this.selectedTarget;
  }
  getSelectedTargetingScheme() {
    return this.selectedTargetingScheme;
  }
  getSelectedItemId() {
    return this.selectedItemId;
  }

  setSelectedActionAndRank(actionAndRank: Option<ActionAndRank>) {
    this.selectedActionAndRank = actionAndRank;
  }

  setSelectedTarget(targetOption: Option<CombatActionTarget>) {
    this.selectedTarget = targetOption;
  }
  setSelectedTargetingScheme(selectedTargetingSchemeOption: Option<TargetingScheme>) {
    this.selectedTargetingScheme = selectedTargetingSchemeOption;
  }
  setSelectedItemId(itemIdOption: Option<EntityId>) {
    this.selectedItemId = itemIdOption;
  }

  assignInitialTargetsForSelectedAction(targetingCalculator: TargetingCalculator) {
    const selectedActionAndRank = this.getSelectedActionAndRank();
    if (selectedActionAndRank === null) {
      this.clear();
      return null;
    } else {
      const actionAndRank = this.getSelectedActionAndRank();
      if (actionAndRank === null) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);
      const filteredIds = targetingCalculator.getFilteredPotentialTargetIdsForAction(actionAndRank);
      const newTargetsResult =
        targetingCalculator.getPreferredOrDefaultActionTargets(actionAndRank);

      if (newTargetsResult instanceof Error) return newTargetsResult;

      const playerOption = targetingCalculator.getPlayerOption();
      if (playerOption) {
        playerOption.targetPreferences.update(actionAndRank, newTargetsResult, filteredIds);

        this.setSelectedTargetingScheme(playerOption.targetPreferences.targetingSchemePreference);
      } else {
        const action = COMBAT_ACTIONS[selectedActionAndRank.actionName];
        const defaultScheme = action.targetingProperties.getTargetingSchemes(
          selectedActionAndRank.rank
        )[0];
        if (defaultScheme === undefined) return new Error("no default targeting scheme found");
        this.setSelectedTargetingScheme(defaultScheme);
      }

      this.setSelectedTarget(newTargetsResult);
      return newTargetsResult;
    }
  }

  /**Set and return next or previous valid target with loop-around*/
  cycleTargets(
    direction: NextOrPrevious,
    playerOption: Option<SpeedDungeonPlayer>,
    validTargetIdsByDisposition: Record<FriendOrFoe, EntityId[]>
  ): CombatActionTarget {
    const { selectedActionAndRank } = this;

    if (selectedActionAndRank === null)
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);

    const { actionName, rank } = selectedActionAndRank;

    const currentTargetOption = this.getSelectedTarget();
    if (currentTargetOption === null) throw new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);

    const action = COMBAT_ACTIONS[actionName];

    const newTargets = getNextOrPreviousTarget(
      action,
      rank,
      currentTargetOption,
      direction,
      validTargetIdsByDisposition
    );

    if (playerOption) {
      playerOption.targetPreferences.update(
        selectedActionAndRank,
        newTargets,
        validTargetIdsByDisposition
      );
    }

    this.setSelectedTarget(newTargets);

    return newTargets;
  }

  cycleTargetingSchemes(targetingCalculator: TargetingCalculator): CombatActionTarget {
    const { selectedActionAndRank } = this;

    if (selectedActionAndRank === null)
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);

    const { actionName, rank } = selectedActionAndRank;

    const currentTargetOption = this.getSelectedTarget();
    if (currentTargetOption === null) throw new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);

    const action = COMBAT_ACTIONS[actionName];

    const targetingSchemes = action.targetingProperties.getTargetingSchemes(rank);

    const lastUsedTargetingScheme = this.selectedTargetingScheme;

    let newTargetingScheme = lastUsedTargetingScheme;

    if (lastUsedTargetingScheme === null || !targetingSchemes.includes(lastUsedTargetingScheme)) {
      const defaultScheme = targetingSchemes[0];
      if (typeof defaultScheme === "undefined")
        throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGETING_SCHEMES);
      newTargetingScheme = defaultScheme;
    } else {
      const lastUsedTargetingSchemeIndex = targetingSchemes.indexOf(lastUsedTargetingScheme);
      if (lastUsedTargetingSchemeIndex < 0)
        throw new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
      const isSelectingLastInList = lastUsedTargetingSchemeIndex === targetingSchemes.length - 1;
      const newSchemeIndex = isSelectingLastInList ? 0 : lastUsedTargetingSchemeIndex + 1;
      newTargetingScheme = targetingSchemes[newSchemeIndex]!;
    }

    // must set targetingScheme here so getValidPreferredOrDefaultActionTargets takes it into account
    this.selectedTargetingScheme = newTargetingScheme;

    const playerOption = targetingCalculator.getPlayerOption();
    if (playerOption) playerOption.targetPreferences.targetingSchemePreference = newTargetingScheme;

    const newTargetsResult =
      targetingCalculator.getPreferredOrDefaultActionTargets(selectedActionAndRank);

    if (newTargetsResult instanceof Error) throw newTargetsResult;

    if (playerOption) {
      const filteredIds =
        targetingCalculator.getFilteredPotentialTargetIdsForAction(selectedActionAndRank);
      playerOption.targetPreferences.update(selectedActionAndRank, newTargetsResult, filteredIds);
    }

    this.setSelectedTarget(newTargetsResult);
    return newTargetsResult;
  }
}
