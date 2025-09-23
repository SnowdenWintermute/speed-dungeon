import { Option } from "../primatives/option.js";
import { CombatActionName, FriendOrFoe, TargetingScheme } from "../combat/combat-actions/index.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import { EntityId, NextOrPrevious } from "../primatives/index.js";
import { SpeedDungeonPlayer } from "../game/player.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { COMBAT_ACTIONS } from "../combat/combat-actions/action-implementations/index.js";
import getNextOrPreviousTarget from "../combat/targeting/get-next-or-previous-target.js";

export interface ActionAndRank {
  actionName: CombatActionName;
  rank: number;
}

export class ActionUserTargetingProperties {
  private selectedActionAndRank: Option<ActionAndRank> = null;
  private selectedTarget: Option<CombatActionTarget> = null;
  private selectedTargetingScheme: Option<TargetingScheme> = null;
  private selectedItemId: Option<EntityId> = null;

  constructor() {}

  clear() {
    this.selectedActionAndRank = null;
    this.selectedTarget = null;
    this.selectedTargetingScheme = null;
    this.selectedItemId = null;
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

  cycleTargets(
    direction: NextOrPrevious,
    playerOption: Option<SpeedDungeonPlayer>,
    validTargetIdsByDisposition: Record<FriendOrFoe, EntityId[]>
  ): Error | CombatActionTarget {
    const { selectedActionAndRank } = this;

    if (selectedActionAndRank === null)
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);

    const { actionName, rank } = selectedActionAndRank;

    const currentTargetOption = this.getSelectedTarget();
    if (currentTargetOption === null) throw new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);

    const action = COMBAT_ACTIONS[actionName];

    const newTargetsResult = getNextOrPreviousTarget(
      action,
      rank,
      currentTargetOption,
      direction,
      validTargetIdsByDisposition
    );
    if (newTargetsResult instanceof Error) return newTargetsResult;

    if (playerOption) {
      playerOption.targetPreferences.update(
        selectedActionAndRank,
        newTargetsResult,
        validTargetIdsByDisposition
      );
    }

    this.setSelectedTarget(newTargetsResult);

    return newTargetsResult;
  }

  cycleCharacterTargetingSchemes(characterId: string): Error | CombatActionTarget {
    const characterAndActionDataResult = getCombatantAndSelectedCombatAction(
      this.context.party,
      characterId
    );
    if (characterAndActionDataResult instanceof Error) return characterAndActionDataResult;
    const { character, combatAction } = characterAndActionDataResult;
    const { targetingProperties } = combatAction;

    const { selectedActionLevel } = character.combatantProperties;
    if (selectedActionLevel === null)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);
    const targetingSchemes = targetingProperties.getTargetingSchemes(selectedActionLevel);

    const lastUsedTargetingScheme = character.combatantProperties.selectedTargetingScheme;

    let newTargetingScheme = lastUsedTargetingScheme;

    if (lastUsedTargetingScheme === null || !targetingSchemes.includes(lastUsedTargetingScheme)) {
      const defaultScheme = targetingSchemes[0];
      if (typeof defaultScheme === "undefined")
        return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGETING_SCHEMES);
      newTargetingScheme = defaultScheme;
    } else {
      const lastUsedTargetingSchemeIndex = targetingSchemes.indexOf(lastUsedTargetingScheme);
      if (lastUsedTargetingSchemeIndex < 0)
        return new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
      const isSelectingLastInList = lastUsedTargetingSchemeIndex === targetingSchemes.length - 1;
      const newSchemeIndex = isSelectingLastInList ? 0 : lastUsedTargetingSchemeIndex + 1;
      newTargetingScheme = targetingSchemes[newSchemeIndex]!;
    }

    // must set targetingScheme here so getValidPreferredOrDefaultActionTargets takes it into account
    character.combatantProperties.selectedTargetingScheme = newTargetingScheme;

    if (this.playerOption) {
      this.playerOption.targetPreferences.targetingSchemePreference = newTargetingScheme;
    }

    const filteredTargetIdsResult = this.getFilteredPotentialTargetIdsForAction(
      combatAction,
      selectedActionLevel
    );
    if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
    const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;
    const newTargetsResult = this.getValidPreferredOrDefaultActionTargets(
      combatAction,
      allyIdsOption,
      opponentIdsOption
    );
    if (newTargetsResult instanceof Error) return newTargetsResult;

    if (this.playerOption) {
      const updatedTargetPreferenceResult = this.getUpdatedTargetPreferences(
        combatAction,
        newTargetsResult,
        allyIdsOption,
        opponentIdsOption
      );
      if (updatedTargetPreferenceResult instanceof Error) return updatedTargetPreferenceResult;

      this.playerOption.targetPreferences = updatedTargetPreferenceResult;
    }

    character.combatantProperties.combatActionTarget = newTargetsResult;
    return newTargetsResult;
  }
}
