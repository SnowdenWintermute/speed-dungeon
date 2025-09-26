import { AdventuringParty } from "../../../adventuring-party/index.js";
import { COMBAT_ACTIONS } from "../../../combat/index.js";
import { COMBATANT_CONDITION_CONSTRUCTORS } from "../../../combatants/combatant-conditions/condition-constructors.js";
import { Combatant, CombatantCondition, MAX_CONDITION_STACKS } from "../../../combatants/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { MaxAndCurrent } from "../../../primatives/max-and-current.js";
import { ActivatedTriggersGameUpdateCommand } from "../../game-update-commands.js";
import { ActionIntentAndUser, ActionResolutionStepContext } from "../index.js";
import { addConditionToUpdate } from "./add-condition-to-update.js";
import { addRemovedConditionStacksToUpdate } from "./add-triggered-condition-to-update.js";

export function handleHit(
  context: ActionResolutionStepContext,
  targetCombatant: Combatant,
  gameUpdateCommand: ActivatedTriggersGameUpdateCommand
) {
  const { tracker, actionUserContext } = context;
  const { actionExecutionIntent } = tracker;
  const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
  const { game, party, actionUser } = actionUserContext;
  const battleOption = AdventuringParty.getBattleOption(party, game);

  const branchingActions: ActionIntentAndUser[] = [];

  for (const condition of targetCombatant.combatantProperties.conditions) {
    if (!condition.triggeredWhenHitBy(actionExecutionIntent.actionName)) continue;

    const { numStacksRemoved, triggeredActions } = condition.onTriggered(
      actionUserContext,
      targetCombatant,
      context.idGenerator
    );

    CombatantCondition.removeStacks(
      condition.id,
      targetCombatant.combatantProperties,
      numStacksRemoved
    );

    branchingActions.push(
      ...triggeredActions.filter((actionIntent) => {
        const action = COMBAT_ACTIONS[actionIntent.actionExecutionIntent.actionName];
        return action.shouldExecute(
          context,
          tracker.getPreviousTrackerInSequenceOption() || undefined
        );
      })
    );

    // add it to the update so the client can remove the triggered conditions if required
    if (numStacksRemoved)
      addRemovedConditionStacksToUpdate(
        condition.id,
        numStacksRemoved,
        gameUpdateCommand,
        targetCombatant.entityProperties.id
      );
  }

  const conditionsToApply = action.hitOutcomeProperties.getAppliedConditions(
    actionUser,
    context.tracker.actionExecutionIntent.rank
  );

  if (conditionsToApply) {
    for (const conditionProperties of conditionsToApply) {
      const condition = new COMBATANT_CONDITION_CONSTRUCTORS[conditionProperties.conditionName](
        context.idGenerator.generate(),
        conditionProperties.appliedBy,
        targetCombatant.getEntityId(),
        conditionProperties.level,
        new MaxAndCurrent(MAX_CONDITION_STACKS, conditionProperties.stacks)
      );

      CombatantCondition.applyToCombatant(condition, targetCombatant, battleOption, party);

      addConditionToUpdate(
        condition,
        gameUpdateCommand,
        targetCombatant.entityProperties.id,
        HitOutcome.Hit
      );
    }

    battleOption?.turnOrderManager.updateTrackers(game, party);
  }

  return branchingActions;
}
