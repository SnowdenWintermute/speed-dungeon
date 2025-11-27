import { ActionAndRank } from "../../../action-user-context/action-user-targeting-properties.js";
import { ActionUserContext } from "../../../action-user-context/index.js";
import { Combatant, CombatantActionState } from "../../../combatants/index.js";
import { ArrayUtils } from "../../../utils/array-utils.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionExecutionIntent, CombatActionName } from "../../combat-actions/index.js";

export type AiActionComparator = (
  a: CombatActionExecutionIntent,
  b: CombatActionExecutionIntent
) => number;

export class AiActionSelector {
  constructor(private actionUserContext: ActionUserContext) {}

  private getConsideredCombatants(
    filteringFunction: (combatant: Combatant) => boolean
  ): Combatant[] {
    const { party } = this.actionUserContext;
    const allCombatants = party.combatantManager.getAllCombatants();
    return allCombatants.filter(filteringFunction);
  }

  private getUsableActionIntents(): CombatActionExecutionIntent[] {
    const { actionUser, party } = this.actionUserContext;
    const ownedActions = Array.from(actionUser.getOwnedAbilities());

    const usableInContext = ([actionName, actionState]: [
      CombatActionName,
      CombatantActionState,
    ]) => {
      const battleOption = this.actionUserContext.getBattleOption();
      const action = COMBAT_ACTIONS[actionName];
      return action.isUsableInThisContext(battleOption);
    };

    const notOnCooldown = ([actionName, actionState]: [CombatActionName, CombatantActionState]) => {
      const isOnCooldown = !!actionState.cooldown?.current;
      return !isOnCooldown;
    };

    const predicates = ArrayUtils.combinePredicates(usableInContext, notOnCooldown);

    const filteredOwnedActions = ownedActions.filter(predicates);

    const possibleActionRanks: ActionAndRank[] = [];
    for (const [actionName, state] of filteredOwnedActions) {
      for (let rank = 1; rank <= state.level; rank += 1) {
        possibleActionRanks.push(new ActionAndRank(actionName, rank));
      }
    }

    return [];
  }

  private filterActionIntentsByThoseThatTargetCombatants(
    actionIntents: CombatActionExecutionIntent[],
    combatants: Combatant[]
  ): CombatActionExecutionIntent[] {
    // @TODO
    return [];
  }

  private getSortedActionIntents(
    actionIntents: CombatActionExecutionIntent[],
    compareFunction?: AiActionComparator
  ) {
    if (compareFunction === undefined) {
      return actionIntents;
    } else {
      const copy = [...actionIntents];
      copy.sort(compareFunction);
      return copy;
    }
  }

  getBestActionIntentOption(
    possibleTargetFilter: (combatant: Combatant) => boolean,
    evaluatorFunction?: AiActionComparator
  ): null | CombatActionExecutionIntent {
    const consideredTargetCombatants = this.getConsideredCombatants(possibleTargetFilter);

    const allPossibleActionIntents = this.getUsableActionIntents();

    const actionIntentsThatCanTargetDesiredTargets =
      this.filterActionIntentsByThoseThatTargetCombatants(
        allPossibleActionIntents,
        consideredTargetCombatants
      );

    const sortedActionIntents = this.getSortedActionIntents(
      actionIntentsThatCanTargetDesiredTargets,
      evaluatorFunction
    );

    const bestIntentOption = sortedActionIntents[0];
    if (bestIntentOption === undefined) {
      return null;
    }

    return bestIntentOption;
  }
}
