import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import {
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatActionName,
} from "../../combat/index.js";
import {
  ActivatedTriggersGameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { Combatant, CombatantClass, CombatantCondition } from "../../combatants/index.js";
import { DurabilityLossCondition } from "../../combat/combat-actions/combat-action-durability-loss-condition.js";
import { DurabilityChangesByEntityId } from "../../durability/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { addRemovedConditionStacksToUpdate } from "./hit-outcome-triggers/add-triggered-condition-to-update.js";
import { onSkillBookRead } from "../../combat/combat-actions/action-implementations/consumables/read-skill-book.js";

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

    const { actionName } = tracker.actionExecutionIntent;
    const action = COMBAT_ACTIONS[actionName];

    if (actionName === CombatActionName.ReadSkillBook) {
      const bookOption = context.tracker.consumableUsed;
      if (bookOption === null) {
        console.error("expected to have paid a book as consumable cost for this action");
      } else {
        const supportClassLevelsGainedResult = onSkillBookRead(
          combatant.combatantProperties,
          bookOption
        );
        if (supportClassLevelsGainedResult instanceof Error)
          console.error(supportClassLevelsGainedResult);
        else {
          gameUpdateCommand.supportClassLevelsGained = {
            [combatant.entityProperties.id]:
              supportClassLevelsGainedResult.supportClassLevelIncreased,
          };
        }
      }
    }

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

    // action was used by a condition, remove stacks and send removed stacks update
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
