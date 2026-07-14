import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatActionComponent } from "../combat-actions/index.js";
import {
  CombatActionTarget,
  CombatActionTargetType,
  TargetingSelection,
} from "./combat-action-targets.js";
import { getValidPreferredOrDefaultActionTargets } from "./get-valid-preferred-or-default-action-targets.js";
import { EntityId } from "../../aliases.js";
import { getActionTargetsIfSchemeIsValid } from "./get-targets-if-scheme-is-valid.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { COMBAT_ACTIONS } from "../combat-actions/action-implementations/index.js";
import { TargetFilterer } from "./filtering.js";
import { ActionAndRank } from "../../action-user-context/action-user-targeting-properties.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { ProhibitedTargetCombatantStates } from "../combat-actions/prohibited-target-combatant-states.js";
import {
  FriendOrFoe,
  TargetingScheme,
} from "../combat-actions/targeting-schemes-and-categories.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { CombatActionExecutionIntent } from "../combat-actions/combat-action-execution-intent.js";

export class TargetingCalculator {
  constructor(
    private context: ActionUserContext,
    private playerOption: null | SpeedDungeonPlayer
  ) {}

  getPlayerOption() {
    return this.playerOption;
  }

  getCombatActionTargetIds(
    combatAction: CombatActionComponent,
    targets: CombatActionTarget
  ): Error | EntityId[] {
    const { targetingProperties } = combatAction;
    return this.getTargetIds(targets, targetingProperties.prohibitedTargetCombatantStates);
  }

  getTargetIds(
    targets: CombatActionTarget,
    prohibitedTargetCombatantStates: ProhibitedTargetCombatantStates[]
  ): Error | EntityId[] {
    const idsByDisposition = this.context.getAllyAndOpponentIds();

    const filteredTargets = TargetFilterer.filterPossibleTargetIdsByProhibitedCombatantStates(
      this.context.party,
      prohibitedTargetCombatantStates,
      idsByDisposition,
      this.context.actionUser
    );

    const targetEntityIdsResult = getActionTargetsIfSchemeIsValid(targets, filteredTargets);

    return targetEntityIdsResult;
  }

  getValidTargetsByDisposition() {
    const targetingProperties = this.context.actionUser.getTargetingProperties();
    const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
    if (selectedActionAndRank === null)
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);

    return this.getFilteredPotentialTargetIdsForAction(selectedActionAndRank);
  }

  getFilteredPotentialTargetIdsForAction(actionAndRank: ActionAndRank) {
    const { party, actionUser } = this.context;
    const { combatantManager } = party;
    const actionUserId = actionUser.getEntityId();
    const allyAndOpponentIds = combatantManager.getCombatantIdsByDisposition(actionUserId);
    const { actionName, rank } = actionAndRank;
    const action = COMBAT_ACTIONS[actionName];
    const { targetingProperties } = action;

    const prohibitedTargetCombatantStates = targetingProperties.prohibitedTargetCombatantStates;

    const filtered = TargetFilterer.filterPossibleTargetIdsByProhibitedCombatantStates(
      party,
      prohibitedTargetCombatantStates,
      allyAndOpponentIds,
      this.context.actionUser
    );

    TargetFilterer.filterPossibleTargetIdsByActionTargetCategories(
      targetingProperties.getValidTargetCategories(rank),
      actionUserId,
      filtered
    );

    return filtered;
  }

  getValidTargetsForScheme(
    actionAndRank: ActionAndRank,
    targetingScheme: TargetingScheme
  ): Error | CombatActionTarget[] {
    const { actionName, rank } = actionAndRank;
    const action = COMBAT_ACTIONS[actionName];
    if (!action.targetingProperties.getTargetingSchemes(rank).includes(targetingScheme)) {
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.TARGETING_SCHEME_NOT_AVAILABLE);
    }

    const idsByDisposition = this.getFilteredPotentialTargetIdsForAction(actionAndRank);
    const allyIds = idsByDisposition[FriendOrFoe.Friendly];
    const opponentIds = idsByDisposition[FriendOrFoe.Hostile];
    const neutralIds = idsByDisposition[FriendOrFoe.Neutral];

    switch (targetingScheme) {
      case TargetingScheme.Single:
        return [...allyIds, ...opponentIds, ...neutralIds].map((targetId) => ({
          type: CombatActionTargetType.Single,
          targetId,
        }));
      case TargetingScheme.Area: {
        const groupTargets: CombatActionTarget[] = [];
        if (allyIds.length > 0) {
          groupTargets.push({
            type: CombatActionTargetType.Group,
            friendOrFoe: FriendOrFoe.Friendly,
          });
        }
        if (opponentIds.length > 0) {
          groupTargets.push({
            type: CombatActionTargetType.Group,
            friendOrFoe: FriendOrFoe.Hostile,
          });
        }
        if (neutralIds.length > 0) {
          groupTargets.push({
            type: CombatActionTargetType.Group,
            friendOrFoe: FriendOrFoe.Neutral,
          });
        }
        return groupTargets;
      }
      case TargetingScheme.All:
        return [{ type: CombatActionTargetType.All }];
    }
  }

  getTargetingSelectionForClickedCombatant(clickedCombatantId: EntityId): TargetingSelection | null {
    const targetingProperties = this.context.actionUser.getTargetingProperties();
    const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
    const selectedScheme = targetingProperties.getSelectedTargetingScheme();
    if (selectedActionAndRank === null || selectedScheme === null) {
      return null;
    }

    const validTargetsResult = this.getValidTargetsForScheme(selectedActionAndRank, selectedScheme);
    if (validTargetsResult instanceof Error) {
      return null;
    }

    const action = COMBAT_ACTIONS[selectedActionAndRank.actionName];
    for (const validTarget of validTargetsResult) {
      const targetIdsResult = this.getCombatActionTargetIds(action, validTarget);
      if (targetIdsResult instanceof Error) {
        continue;
      }
      if (targetIdsResult.includes(clickedCombatantId)) {
        return { targetingScheme: selectedScheme, target: validTarget };
      }
    }

    return null;
  }

  getPreferredOrDefaultActionTargets(actionAndRank: ActionAndRank) {
    const filteredIds = this.getFilteredPotentialTargetIdsForAction(actionAndRank);
    const newTargetsResult = getValidPreferredOrDefaultActionTargets(
      this.context.actionUser,
      this.playerOption,
      actionAndRank,
      filteredIds
    );

    return newTargetsResult;
  }

  getPrimaryTargetCombatantId(actionExecutionIntent: CombatActionExecutionIntent) {
    switch (actionExecutionIntent.targets.type) {
      case CombatActionTargetType.Single:
        return actionExecutionIntent.targets.targetId;
      case CombatActionTargetType.DistinctIds:
      case CombatActionTargetType.Sides:
      case CombatActionTargetType.SingleAndSides:
      case CombatActionTargetType.Group:
      case CombatActionTargetType.All: {
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
  }

  getPrimaryTargetCombatant(
    party: AdventuringParty,
    actionExecutionIntent: CombatActionExecutionIntent
  ) {
    const primaryTargetIdResult = this.getPrimaryTargetCombatantId(actionExecutionIntent);
    if (primaryTargetIdResult instanceof Error) return primaryTargetIdResult;
    const primaryTarget = party.combatantManager.getExpectedCombatant(primaryTargetIdResult);
    return primaryTarget;
  }

  // I made this to check if the targeting scheme still matches after changing action level
  // since changing to a lower action level may limit available schemes
  // @REFACTOR - it is more intuitive to always set a targeting scheme when selecting an action
  // and rank. we could just take into account the previously selected targeting scheme and keep it
  // if it is still valid, instead of keeping the previously selected targeting scheme set and then
  // checking if it is valid
  selectedTargetingSchemeIsAvailableOnSelectedActionLevel() {
    const targetingProperties = this.context.actionUser.getTargetingProperties();
    const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
    const selectedTargetingScheme = targetingProperties.getSelectedTargetingScheme();

    if (selectedActionAndRank === null) {
      if (selectedTargetingScheme !== null) return false;
      return true;
    }

    if (selectedActionAndRank !== null && selectedTargetingScheme !== null) {
      const { actionName, rank } = selectedActionAndRank;
      const action = COMBAT_ACTIONS[actionName];
      const availableSchemes = action.targetingProperties.getTargetingSchemes(rank);
      if (availableSchemes.includes(selectedTargetingScheme)) {
        return true;
      }
    }
    return false;
  }

  /** Changing action to a lower rank may invalidate the current targeting scheme. If updated, return new targets. */
  updateTargetingSchemeAfterSelectingActionLevel() {
    const userTargetingProperties = this.context.actionUser.getTargetingProperties();

    // check if current targets are still valid at this level
    const selectedTargetingSchemeStillValid =
      this.selectedTargetingSchemeIsAvailableOnSelectedActionLevel();
    // if not, assign initial targets
    if (!selectedTargetingSchemeStillValid) {
      return userTargetingProperties.cycleTargetingSchemes(this);
    }
  }
}
