import cloneDeep from "lodash.clonedeep";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonPlayer } from "../../game/index.js";
import {
  CombatActionComponent,
  CombatActionExecutionIntent,
  FriendOrFoe,
  TargetingScheme,
} from "../combat-actions/index.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";
import { getValidPreferredOrDefaultActionTargets } from "./get-valid-preferred-or-default-action-targets.js";
import { EntityId, NextOrPrevious } from "../../primatives/index.js";
import { getActionTargetsIfSchemeIsValid } from "./get-targets-if-scheme-is-valid.js";
import { getCombatantAndSelectedCombatAction } from "../../utils/get-owned-character-and-selected-combat-action.js";
import getNextOrPreviousTarget from "./get-next-or-previous-target.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { COMBAT_ACTIONS } from "../combat-actions/action-implementations/index.js";
import { TargetFilterer } from "./filtering.js";

export class TargetingCalculator {
  constructor(
    private context: CombatantContext,
    private playerOption: null | SpeedDungeonPlayer
  ) {}

  // cycleCharacterTargets(
  //   characterId: string,
  //   direction: NextOrPrevious
  // ): Error | CombatActionTarget {
  //   // if (this.playerOption === null) return new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);
  //   const characterAndActionDataResult = getCombatantAndSelectedCombatAction(
  //     this.context.party,
  //     characterId
  //   );

  //   if (characterAndActionDataResult instanceof Error) return characterAndActionDataResult;
  //   const { character, combatAction, currentTarget } = characterAndActionDataResult;

  //   const { selectedActionLevel } = character.combatantProperties;
  //   if (selectedActionLevel === null)
  //     return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);

  //   const filteredTargetIdsResult = this.getFilteredPotentialTargetIdsForAction(
  //     combatAction,
  //     selectedActionLevel
  //   );
  //   if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
  //   const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;

  //   const newTargetsResult = getNextOrPreviousTarget(
  //     combatAction,
  //     selectedActionLevel,
  //     currentTarget,
  //     direction,
  //     characterId,
  //     allyIdsOption,
  //     opponentIdsOption
  //   );
  //   if (newTargetsResult instanceof Error) return newTargetsResult;

  //   if (this.playerOption) {
  //     const updatedTargetPreferenceResult = this.getUpdatedTargetPreferences(
  //       combatAction,
  //       newTargetsResult,
  //       allyIdsOption,
  //       opponentIdsOption
  //     );
  //     if (updatedTargetPreferenceResult instanceof Error) return updatedTargetPreferenceResult;

  //     this.playerOption.targetPreferences = updatedTargetPreferenceResult;
  //   }
  //   character.combatantProperties.combatActionTarget = newTargetsResult;

  //   return newTargetsResult;
  // }

  // cycleCharacterTargetingSchemes(characterId: string): Error | CombatActionTarget {
  //   const characterAndActionDataResult = getCombatantAndSelectedCombatAction(
  //     this.context.party,
  //     characterId
  //   );
  //   if (characterAndActionDataResult instanceof Error) return characterAndActionDataResult;
  //   const { character, combatAction } = characterAndActionDataResult;
  //   const { targetingProperties } = combatAction;

  //   const { selectedActionLevel } = character.combatantProperties;
  //   if (selectedActionLevel === null)
  //     return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);
  //   const targetingSchemes = targetingProperties.getTargetingSchemes(selectedActionLevel);

  //   const lastUsedTargetingScheme = character.combatantProperties.selectedTargetingScheme;

  //   let newTargetingScheme = lastUsedTargetingScheme;

  //   if (lastUsedTargetingScheme === null || !targetingSchemes.includes(lastUsedTargetingScheme)) {
  //     const defaultScheme = targetingSchemes[0];
  //     if (typeof defaultScheme === "undefined")
  //       return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGETING_SCHEMES);
  //     newTargetingScheme = defaultScheme;
  //   } else {
  //     const lastUsedTargetingSchemeIndex = targetingSchemes.indexOf(lastUsedTargetingScheme);
  //     if (lastUsedTargetingSchemeIndex < 0)
  //       return new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
  //     const isSelectingLastInList = lastUsedTargetingSchemeIndex === targetingSchemes.length - 1;
  //     const newSchemeIndex = isSelectingLastInList ? 0 : lastUsedTargetingSchemeIndex + 1;
  //     newTargetingScheme = targetingSchemes[newSchemeIndex]!;
  //   }

  //   // must set targetingScheme here so getValidPreferredOrDefaultActionTargets takes it into account
  //   character.combatantProperties.selectedTargetingScheme = newTargetingScheme;

  //   if (this.playerOption) {
  //     this.playerOption.targetPreferences.targetingSchemePreference = newTargetingScheme;
  //   }

  //   const filteredTargetIdsResult = this.getFilteredPotentialTargetIdsForAction(
  //     combatAction,
  //     selectedActionLevel
  //   );
  //   if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
  //   const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;
  //   const newTargetsResult = this.getValidPreferredOrDefaultActionTargets(
  //     combatAction,
  //     allyIdsOption,
  //     opponentIdsOption
  //   );
  //   if (newTargetsResult instanceof Error) return newTargetsResult;

  //   if (this.playerOption) {
  //     const updatedTargetPreferenceResult = this.getUpdatedTargetPreferences(
  //       combatAction,
  //       newTargetsResult,
  //       allyIdsOption,
  //       opponentIdsOption
  //     );
  //     if (updatedTargetPreferenceResult instanceof Error) return updatedTargetPreferenceResult;

  //     this.playerOption.targetPreferences = updatedTargetPreferenceResult;
  //   }

  //   character.combatantProperties.combatActionTarget = newTargetsResult;
  //   return newTargetsResult;
  // }

  getCombatActionTargetIds(
    combatAction: CombatActionComponent,
    targets: CombatActionTarget
  ): Error | EntityId[] {
    const { allyIds, opponentIds } = this.context.getAllyAndOpponentIds();
    const { targetingProperties } = combatAction;

    const filteredTargetsResult = TargetFilterer.filterPossibleTargetIdsByProhibitedCombatantStates(
      this.context.party,
      targetingProperties.prohibitedTargetCombatantStates,
      allyIds,
      opponentIds
    );

    if (filteredTargetsResult instanceof Error) return filteredTargetsResult;
    const [filteredAllyIds, filteredOpponentIdsOption] = filteredTargetsResult;

    const targetEntityIdsResult = getActionTargetsIfSchemeIsValid(
      targets,
      filteredAllyIds,
      filteredOpponentIdsOption
    );

    return targetEntityIdsResult;
  }

  assignInitialCombatantActionTargets(combatActionOption: null | CombatActionComponent) {
    const { combatant } = this.context;
    if (combatActionOption === null) {
      combatant.getTargetingProperties().clear();
      return null;
    } else {
      const actionAndRank = combatant.getTargetingProperties().getSelectedActionAndRank();
      if (actionAndRank === null) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);
      const filteredIdsResult = this.getFilteredPotentialTargetIdsForAction(
        combatActionOption,
        actionAndRank.actionName
      );
      if (filteredIdsResult instanceof Error) return filteredIdsResult;
      const [allyIdsOption, opponentIdsOption] = filteredIdsResult;
      const newTargetsResult = this.getPreferredOrDefaultActionTargets(
        combatActionOption,
        actionAndRank.actionName
      );

      if (newTargetsResult instanceof Error) return newTargetsResult;

      if (this.playerOption) {
        this.playerOption.targetPreferences.update(
          actionAndRank,
          newTargetsResult,
          allyIdsOption,
          opponentIdsOption
        );

        combatant
          .getTargetingProperties()
          .setSelectedTargetingScheme(
            this.playerOption.targetPreferences.targetingSchemePreference
          );
      } else {
        const { selectedActionLevel } = combatant.combatantProperties;
        if (selectedActionLevel === null)
          return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);
        const defaultScheme =
          combatActionOption.targetingProperties.getTargetingSchemes(selectedActionLevel)[0];
        if (defaultScheme === undefined) return new Error("no default targeting scheme found");
        combatant.combatantProperties.selectedTargetingScheme = defaultScheme;
      }

      combatant.combatantProperties.selectedCombatAction = combatActionOption.name;
      combatant.combatantProperties.combatActionTarget = newTargetsResult;
      return newTargetsResult;
    }
  }

  getFilteredPotentialTargetIdsForAction(
    combatAction: CombatActionComponent,
    actionLevel: number
  ): Error | [null | string[], null | string[]] {
    const { party, combatant } = this.context;
    const actionUserId = combatant.entityProperties.id;
    const allyAndOpponentIds = this.context.getAllyAndOpponentIds();
    let { allyIds, opponentIds } = allyAndOpponentIds;
    const { targetingProperties } = combatAction;

    const prohibitedTargetCombatantStates = targetingProperties.prohibitedTargetCombatantStates;

    const filteredTargetsResult = TargetFilterer.filterPossibleTargetIdsByProhibitedCombatantStates(
      party,
      prohibitedTargetCombatantStates,
      allyIds,
      opponentIds
    );
    if (filteredTargetsResult instanceof Error) return filteredTargetsResult;

    [allyIds, opponentIds] = filteredTargetsResult;

    [allyIds, opponentIds] = TargetFilterer.filterPossibleTargetIdsByActionTargetCategories(
      targetingProperties.getValidTargetCategories(actionLevel),
      actionUserId,
      allyIds,
      opponentIds
    );

    return [allyIds, opponentIds];
  }

  getValidPreferredOrDefaultActionTargets = (
    combatAction: CombatActionComponent,
    allyIdsOption: null | EntityId[],
    opponentIdsOption: null | EntityId[]
  ) =>
    getValidPreferredOrDefaultActionTargets(
      this.context.combatant,
      this.playerOption,
      combatAction,
      allyIdsOption,
      opponentIdsOption
    );

  getPreferredOrDefaultActionTargets(combatAction: CombatActionComponent, actionLevel: number) {
    const filteredIdsResult = this.getFilteredPotentialTargetIdsForAction(
      combatAction,
      actionLevel
    );
    if (filteredIdsResult instanceof Error) return filteredIdsResult;
    const [allyIdsOption, opponentIdsOption] = filteredIdsResult;
    const newTargetsResult = this.getValidPreferredOrDefaultActionTargets(
      combatAction,
      allyIdsOption,
      opponentIdsOption
    );

    return newTargetsResult;
  }

  // getUpdatedTargetPreferences(
  //   combatAction: CombatActionComponent,
  //   newTargets: CombatActionTarget,
  //   allyIdsOption: null | string[],
  //   opponentIdsOption: null | string[]
  // ) {
  //   if (!this.playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  //   const newPreferences = cloneDeep(this.playerOption.targetPreferences);
  //   const { targetingProperties } = combatAction;

  //   const { selectedActionLevel } = this.context.combatant.combatantProperties;
  //   if (selectedActionLevel === null)
  //     return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_LEVEL_SELECTED);

  //   const targetingSchemes = targetingProperties.getTargetingSchemes(selectedActionLevel);

  //   switch (newTargets.type) {
  //     case CombatActionTargetType.Single:
  //       const { targetId } = newTargets;
  //       const isOpponentId = !!opponentIdsOption?.includes(targetId);
  //       if (isOpponentId) {
  //         newPreferences.hostileSingle = targetId;
  //         newPreferences.category = FriendOrFoe.Hostile;
  //       } else if (allyIdsOption?.includes(targetId)) {
  //         newPreferences.friendlySingle = targetId;
  //         newPreferences.category = FriendOrFoe.Friendly;
  //       }
  //       break;
  //     case CombatActionTargetType.Group:
  //       const category = newTargets.friendOrFoe;
  //       if (targetingSchemes.length > 1) {
  //         newPreferences.category = category;
  //         newPreferences.targetingSchemePreference = TargetingScheme.Area;
  //       } else {
  //         // if they had no choice in targeting schemes, don't update their preference
  //       }
  //       break;
  //     case CombatActionTargetType.All:
  //       if (targetingSchemes.length > 1)
  //         newPreferences.targetingSchemePreference = TargetingScheme.All;
  //   }

  //   return newPreferences;
  // }

  getPrimaryTargetCombatantId(actionExecutionIntent: CombatActionExecutionIntent) {
    switch (actionExecutionIntent.targets.type) {
      case CombatActionTargetType.Single:
        return actionExecutionIntent.targets.targetId;
      case CombatActionTargetType.DistinctIds:
      case CombatActionTargetType.Sides:
      case CombatActionTargetType.SingleAndSides:
      case CombatActionTargetType.Group:
      case CombatActionTargetType.All:
        const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
        const targetIdsResult = this.getCombatActionTargetIds(
          action,
          actionExecutionIntent.targets
        );
        if (targetIdsResult instanceof Error) return targetIdsResult;
        const primaryTargetIdOption = targetIdsResult[0];
        if (primaryTargetIdOption === undefined)
          return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
        return primaryTargetIdOption;
    }
  }

  getPrimaryTargetCombatant(
    party: AdventuringParty,
    actionExecutionIntent: CombatActionExecutionIntent
  ) {
    const primaryTargetIdResult = this.getPrimaryTargetCombatantId(actionExecutionIntent);
    if (primaryTargetIdResult instanceof Error) return primaryTargetIdResult;
    const primaryTargetResult = AdventuringParty.getCombatant(party, primaryTargetIdResult);
    if (primaryTargetResult instanceof Error) return primaryTargetResult;
    return primaryTargetResult;
  }

  // I made this to check if the targeting scheme still matches after changing action level
  // since changing to a lower action level may limit available schemes
  selectedTargetingSchemeIsAvailableOnSelectedActionLevel() {
    const { combatantProperties } = this.context.combatant;
    const { selectedCombatAction, selectedActionLevel, selectedTargetingScheme } =
      combatantProperties;
    if (selectedCombatAction === null) {
      if (combatantProperties.selectedTargetingScheme !== null) return false;
      return true;
    }

    if (selectedActionLevel !== null && selectedTargetingScheme !== null) {
      const action = COMBAT_ACTIONS[selectedCombatAction];
      const availableSchemes = action.targetingProperties.getTargetingSchemes(selectedActionLevel);
      if (availableSchemes.includes(selectedTargetingScheme)) {
        return true;
      }
    }
    return false;
  }

  /** If updated, return new targets */
  updateTargetingSchemeAfterSelectingActionLevel(newSelectedActionLevel: number) {
    const { combatantProperties } = this.context.combatant;
    combatantProperties.selectedActionLevel = newSelectedActionLevel;

    // check if current targets are still valid at this level
    const selectedTargetingSchemeStillValid =
      this.selectedTargetingSchemeIsAvailableOnSelectedActionLevel();
    // if not, assign initial targets
    if (!selectedTargetingSchemeStillValid) {
      return this.cycleCharacterTargetingSchemes(this.context.combatant.entityProperties.id);
    }
  }
}
