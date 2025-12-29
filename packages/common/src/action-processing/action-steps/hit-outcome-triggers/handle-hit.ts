import { CombatantId } from "../../../aliases.js";
import { COMBAT_ACTIONS } from "../../../combat/combat-actions/action-implementations/index.js";
import { Combatant } from "../../../combatants/index.js";
import { CombatantConditionFactory } from "../../../conditions/condition-factory.js";
import { HitOutcome } from "../../../hit-outcome.js";
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
  const battleOption = party.getBattleOption(game);

  const branchingActions: ActionIntentAndUser[] = [];

  const { conditionManager } = targetCombatant.combatantProperties;

  for (const condition of conditionManager.getConditions()) {
    const conditionHasNoHitTrigger = !condition.triggeredWhenHitBy?.includes(
      actionExecutionIntent.actionName
    );
    if (conditionHasNoHitTrigger) continue;

    const { numStacksRemoved, triggeredActions } = condition.onTriggered(
      actionUserContext,
      targetCombatant,
      context.idGenerator
    );

    conditionManager.removeStacks(condition.id, numStacksRemoved);

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
    if (numStacksRemoved) {
      addRemovedConditionStacksToUpdate(
        condition.id,
        numStacksRemoved,
        gameUpdateCommand,
        targetCombatant.getEntityId()
      );
    }
  }

  const conditionsToApply = action.hitOutcomeProperties.getAppliedConditions(
    actionUser,
    context.tracker.actionExecutionIntent.rank
  );

  if (conditionsToApply) {
    for (const conditionProperties of conditionsToApply) {
      const condition = CombatantConditionFactory.create({
        ...conditionProperties,
        id: context.idGenerator.generate(),
        appliedTo: targetCombatant.getEntityId(),
      });

      const { conditionManager } = targetCombatant.combatantProperties;
      conditionManager.applyCondition(condition);
      if (battleOption !== null) {
        battleOption.turnOrderManager.turnSchedulerManager.addConditionToTurnOrder(
          party,
          condition
        );
      }

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
