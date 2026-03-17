import cloneDeep from "lodash.clonedeep";
import { ActionAndRank } from "../../../action-user-context/action-user-targeting-properties.js";
import { ActionUserContext } from "../../../action-user-context/index.js";
import { Combatant } from "../../../combatants/index.js";
import { NextOrPrevious } from "../../../primatives/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import {
  CombatActionTarget,
  combatActionTargetsAreEqual,
} from "../../targeting/combat-action-targets.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { ArrayUtils } from "../../../utils/array-utils.js";
import { ActionRank, EntityId } from "../../../aliases.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";

export type AiActionEvaluator = (
  intents: CombatActionExecutionIntent[],
  actionUserContext: ActionUserContext,
  consideredCombatants: Combatant[]
) => null | CombatActionExecutionIntent;

export class AiActionSelector {
  constructor(private actionUserContext: ActionUserContext) {}

  private getConsideredCombatants(
    filteringFunctions: ((combatant: Combatant) => boolean)[]
  ): Combatant[] {
    const { party } = this.actionUserContext;
    const allCombatants = party.combatantManager.iterateAllCombatants();
    return allCombatants.filter((combatant) =>
      filteringFunctions.every((filteringFunction) => filteringFunction(combatant))
    );
  }

  private getPotentialTargetsForActionAndRank(actionAndRank: ActionAndRank) {
    const { actionUser } = this.actionUserContext;
    const targetingProperties = actionUser.getTargetingProperties();
    targetingProperties.setSelectedActionAndRank(actionAndRank);

    const targetingCalculator = new TargetingCalculator(this.actionUserContext, null);

    // must set it as selected since targetingCalculator will look for it
    const initialTargetsResult =
      targetingProperties.assignInitialTargetsForSelectedAction(targetingCalculator);

    if (initialTargetsResult instanceof Error) {
      console.error(initialTargetsResult);
      return [];
    }

    const targetOptions: CombatActionTarget[] = [];

    const { actionName, rank } = actionAndRank;
    const action = COMBAT_ACTIONS[actionName];

    const targetingSchemeOptions = [...action.targetingProperties.getTargetingSchemes(rank)];

    const validTargetsByDisposition =
      targetingCalculator.getFilteredPotentialTargetIdsForAction(actionAndRank);

    for (const currentTargetingSchemeIndex of targetingSchemeOptions) {
      let currentOption = targetingProperties.cycleTargets(
        NextOrPrevious.Next,
        null,
        validTargetsByDisposition
      );

      while (
        !targetOptions.some((existing) => combatActionTargetsAreEqual(existing, currentOption))
      ) {
        targetOptions.push(currentOption);

        currentOption = targetingProperties.cycleTargets(
          NextOrPrevious.Next,
          null,
          validTargetsByDisposition
        );
      }

      targetingProperties.cycleTargetingSchemes(targetingCalculator);

      const selectedTarget = targetingProperties.getSelectedTarget();
      if (selectedTarget !== null) {
        currentOption = cloneDeep(selectedTarget);
      }
    }

    return targetOptions;
  }

  private getUsableActionRankPairs(): ActionAndRank[] {
    const { actionUser, party } = this.actionUserContext;
    const ownedActions = Array.from(actionUser.getOwnedActions());
    const battleOption = this.actionUserContext.getBattleOption();
    const possibleActionRanks: ActionAndRank[] = [];

    // make sure the action is usable at this rank
    for (const [actionName, state] of ownedActions) {
      for (let rank = 1; rank <= state.level; rank += 1) {
        const actionAndRank = new ActionAndRank(actionName, rank as ActionRank);
        const { canUse } = actionUser.actionAndRankMeetsUseRequirements(
          actionAndRank,
          party,
          battleOption
        );

        if (canUse) {
          possibleActionRanks.push(new ActionAndRank(actionName, rank as ActionRank));
        }
      }
    }

    return possibleActionRanks;
  }

  private getUsableActionIntents(): CombatActionExecutionIntent[] {
    const possibleActionRanks = this.getUsableActionRankPairs();

    // collect possible targets and build the intents
    const toReturn: CombatActionExecutionIntent[] = [];
    for (const pair of possibleActionRanks) {
      const { actionName, rank } = pair;
      const possibleTargets = this.getPotentialTargetsForActionAndRank(pair);
      toReturn.push(
        ...possibleTargets.map(
          (targets) => new CombatActionExecutionIntent(actionName, rank, targets)
        )
      );
    }

    return toReturn;
  }

  private filterActionIntentsByThoseThatTargetCombatants(
    actionIntents: CombatActionExecutionIntent[],
    combatantIds: EntityId[]
  ): CombatActionExecutionIntent[] {
    const targetingCalculator = new TargetingCalculator(this.actionUserContext, null);

    return actionIntents.filter((actionIntent) => {
      const { actionName, rank, targets } = actionIntent;

      const targetIds = targetingCalculator.getCombatActionTargetIds(
        COMBAT_ACTIONS[actionName],
        targets
      );

      if (targetIds instanceof Error) {
        throw targetIds;
      }

      if (ArrayUtils.overlaps(targetIds, combatantIds)) {
        return true;
      } else {
        return false;
      }
    });
  }

  getBestActionIntentOption(
    possibleTargetFilters: ((combatant: Combatant) => boolean)[],
    evaluator: AiActionEvaluator
  ): null | CombatActionExecutionIntent {
    const consideredTargetCombatants = this.getConsideredCombatants(possibleTargetFilters);

    const allPossibleActionIntents = this.getUsableActionIntents();

    const actionIntentsThatCanTargetDesiredTargets =
      this.filterActionIntentsByThoseThatTargetCombatants(
        allPossibleActionIntents,
        consideredTargetCombatants.map((combatant) => combatant.getEntityId())
      );

    const bestIntentOption = evaluator(
      actionIntentsThatCanTargetDesiredTargets,
      this.actionUserContext,
      consideredTargetCombatants
    );

    return bestIntentOption;
  }
}
