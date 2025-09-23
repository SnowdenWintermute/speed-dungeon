import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonPlayer } from "../../game/index.js";
import { CombatActionComponent, CombatActionExecutionIntent } from "../combat-actions/index.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";
import { getValidPreferredOrDefaultActionTargets } from "./get-valid-preferred-or-default-action-targets.js";
import { EntityId } from "../../primatives/index.js";
import { getActionTargetsIfSchemeIsValid } from "./get-targets-if-scheme-is-valid.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { COMBAT_ACTIONS } from "../combat-actions/action-implementations/index.js";
import { TargetFilterer } from "./filtering.js";
import { ActionAndRank } from "../../combatant-context/action-user-targeting-properties.js";
import { ActionUserContext } from "../../combatant-context/action-user.js";

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
    const idsByDisposition = this.context.getAllyAndOpponentIds();
    const { targetingProperties } = combatAction;

    const filteredTargets = TargetFilterer.filterPossibleTargetIdsByProhibitedCombatantStates(
      this.context.party,
      targetingProperties.prohibitedTargetCombatantStates,
      idsByDisposition
    );

    const targetEntityIdsResult = getActionTargetsIfSchemeIsValid(targets, filteredTargets);

    return targetEntityIdsResult;
  }

  getFilteredPotentialTargetIdsForAction(actionAndRank: ActionAndRank) {
    const { party, actionUser } = this.context;
    const actionUserId = actionUser.getEntityId();
    const allyAndOpponentIds = this.context.getAllyAndOpponentIds();
    const { actionName, rank } = actionAndRank;
    const action = COMBAT_ACTIONS[actionName];
    const { targetingProperties } = action;

    const prohibitedTargetCombatantStates = targetingProperties.prohibitedTargetCombatantStates;

    const filtered = TargetFilterer.filterPossibleTargetIdsByProhibitedCombatantStates(
      party,
      prohibitedTargetCombatantStates,
      allyAndOpponentIds
    );

    TargetFilterer.filterPossibleTargetIdsByActionTargetCategories(
      targetingProperties.getValidTargetCategories(rank),
      actionUserId,
      filtered
    );

    return filtered;
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
