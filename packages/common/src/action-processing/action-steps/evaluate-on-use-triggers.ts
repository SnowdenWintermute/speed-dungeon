import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../combat/index.js";
import {
  ActivatedTriggersGameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { Combatant, CombatantCondition } from "../../combatants/index.js";
import { DurabilityLossCondition } from "../../combat/combat-actions/combat-action-durability-loss-condition.js";
import { DurabilityChangesByEntityId } from "../../durability/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { addRemovedConditionStacksToUpdate } from "./hit-outcome-triggers/add-triggered-condition-to-update.js";

const stepType = ActionResolutionStepType.EvalOnUseTriggers;
export class EvalOnUseTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: ActivatedTriggersGameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
    };

    super(stepType, context, gameUpdateCommand);

    const { tracker, combatantContext } = context;
    const { game, party, combatant } = combatantContext;

    const action = COMBAT_ACTIONS[tracker.actionExecutionIntent.actionName];

    const durabilityChanges = new DurabilityChangesByEntityId();
    durabilityChanges.updateConditionalChangesOnUser(
      combatant,
      action,
      DurabilityLossCondition.OnUse
    );

    if (!durabilityChanges.isEmpty()) {
      gameUpdateCommand.durabilityChanges = durabilityChanges;

      DurabilityChangesByEntityId.ApplyToGame(game, durabilityChanges);
    }

    // if it is a condition, remove stacks and send removed stacks update
    if (combatant.combatantProperties.asShimmedUserOfTriggeredCondition) {
      const { condition } = combatant.combatantProperties.asShimmedUserOfTriggeredCondition;
      const tickPropertiesOption = CombatantCondition.getTickProperties(condition);
      if (tickPropertiesOption) {
        const onTick = tickPropertiesOption.onTick(condition, context.combatantContext);
        const { numStacksRemoved } = onTick;
        const { entityConditionWasAppliedTo } =
          combatant.combatantProperties.asShimmedUserOfTriggeredCondition;
        const hostEntity = AdventuringParty.getCombatant(party, entityConditionWasAppliedTo);
        if (hostEntity instanceof Error) throw hostEntity;
        CombatantCondition.removeStacks(
          condition.id,
          hostEntity.combatantProperties,
          numStacksRemoved
        );
        // send update
        addRemovedConditionStacksToUpdate(
          condition.id,
          numStacksRemoved,
          gameUpdateCommand,
          hostEntity.entityProperties.id
        );
      }
    }
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    const branchingActions: {
      user: Combatant;
      actionExecutionIntent: CombatActionExecutionIntent;
    }[] = [];
    return branchingActions;
  }
}
