import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../combat/index.js";
import {
  ActivatedTriggersGameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { Combatant } from "../../combatants/index.js";
import { DurabilityLossCondition } from "../../combat/combat-actions/combat-action-durability-loss-condition.js";
import { DurabilityChangesByEntityId } from "../../durability/index.js";
import { SpawnableEntityType } from "../../spawnables/index.js";

const stepType = ActionResolutionStepType.EvalOnUseTriggers;
export class EvalOnUseTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    let gameUpdateCommand: ActivatedTriggersGameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
    };

    super(stepType, context, gameUpdateCommand);

    const { tracker, actionUserContext } = context;
    const { game, party, actionUser } = actionUserContext;

    const { actionName } = tracker.actionExecutionIntent;
    const action = COMBAT_ACTIONS[actionName];

    const onUseTriggers = action.hitOutcomeProperties.getOnUseTriggers(context);
    Object.assign(gameUpdateCommand, onUseTriggers);

    const { petSlotsSummoned, petsUnsummoned } = onUseTriggers;
    if (petSlotsSummoned) {
      const { petManager } = party;
      const battleOption = party.getBattleOption(game);

      for (const { ownerId, slotIndex } of petSlotsSummoned) {
        const pet = petManager.summonPetFromSlot(party, ownerId, slotIndex, battleOption);

        this.context.tracker.spawnedEntities.push({
          type: SpawnableEntityType.Combatant,
          combatant: pet,
          petProperties: { ownerId: actionUser.getEntityId() },
        });
      }
    }

    if (petsUnsummoned) {
      for (const petId of petsUnsummoned) {
        const expectedPet = party.combatantManager.getExpectedCombatant(petId);
        const summonedBy = expectedPet.combatantProperties.controlledBy.summonedBy;
        if (summonedBy === undefined) {
          throw new Error("Expected a pet to have been summoned by someone");
        }

        // get expected empty pet slot
        // put back in pet slot
        // tell client to despawn pet model
        // tell client to put pet back in owner's pet slot
      }
    }

    const durabilityChanges = new DurabilityChangesByEntityId();
    durabilityChanges.updateConditionalChangesOnUser(
      actionUser,
      action,
      DurabilityLossCondition.OnUse
    );

    if (!durabilityChanges.isEmpty()) {
      gameUpdateCommand.durabilityChanges = durabilityChanges;

      DurabilityChangesByEntityId.ApplyToGame(party, durabilityChanges);
    }
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions(): Error | ActionIntentAndUser[] {
    const branchingActions: {
      user: Combatant;
      actionExecutionIntent: CombatActionExecutionIntent;
    }[] = [];
    return branchingActions;
  }
}
