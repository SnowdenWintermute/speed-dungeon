import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import {
  ActivatedTriggersGameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { DurabilityLossCondition } from "../../combat/combat-actions/combat-action-durability-loss-condition.js";
import { DurabilityChangesByEntityId } from "../../durability/index.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { getStartFlyingActionIntentIfAble } from "../../conditions/configs/ensnared.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { getKillAttachedCombatantsActionIntents } from "./hit-outcome-triggers/index.js";
import { rollIsSuccess } from "../../utility-classes/random-number-generation-policy.js";
import { DURABILITY_LOSS_CHANCE } from "../../app-consts.js";

const stepType = ActionResolutionStepType.EvalOnUseTriggers;
export class EvalOnUseTriggersActionResolutionStep extends ActionResolutionStep {
  branchingActions: ActionIntentAndUser[] = [];

  constructor(context: ActionResolutionStepContext) {
    const { actionUser } = context.actionUserContext;
    const gameUpdateCommand: ActivatedTriggersGameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      actionUserName: actionUser.getName(),
      actionUserId: actionUser.getEntityId(),
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
    };

    super(stepType, context, gameUpdateCommand);

    const { tracker, actionUserContext } = context;
    const { game, party } = actionUserContext;

    const { actionName } = tracker.actionExecutionIntent;
    const action = COMBAT_ACTIONS[actionName];

    const onUseTriggers = action.hitOutcomeProperties.getOnUseTriggers(context);
    Object.assign(gameUpdateCommand, onUseTriggers);

    const { petSlotsSummoned, petsUnsummoned, petSlotsReleased } = onUseTriggers;
    const { petManager } = party;
    const battleOption = party.getBattleOption(game);

    if (petSlotsSummoned) {
      for (const { slot, withDelay } of petSlotsSummoned) {
        const { ownerId, slotIndex } = slot;
        const petOption = petManager.summonPetFromSlot(game, party, ownerId, slotIndex, withDelay);
        if (petOption) {
          this.context.tracker.spawnedEntities.push({
            type: SpawnableEntityType.Combatant,
            combatant: petOption,
            petProperties: { ownerId: actionUser.getEntityId() },
          });

          // try to gain flying if able
          const startFlyingIntentAndUser = getStartFlyingActionIntentIfAble(petOption);
          if (startFlyingIntentAndUser !== undefined) {
            this.branchingActions.push(startFlyingIntentAndUser);
          }
        }
      }
    }

    if (petsUnsummoned) {
      for (const petId of petsUnsummoned) {
        const pet = party.petManager.unsummonPet(petId, game);
        const branchingActions = getKillAttachedCombatantsActionIntents(pet, party);
        this.branchingActions.push(...branchingActions);
      }
    }

    if (petSlotsReleased) {
      for (const { ownerId, slotIndex } of petSlotsReleased) {
        party.petManager.releasePetInSlot(ownerId, slotIndex);
      }
    }

    const durabilityChanges = new DurabilityChangesByEntityId();

    const roll = this.context.rngPolicy.durabilityLossOnUse.roll();
    const shouldReduceDurability = rollIsSuccess({
      roll,
      successChance: DURABILITY_LOSS_CHANCE,
    });

    if (shouldReduceDurability) {
      durabilityChanges.updateConditionalChangesOnUser(
        actionUser,
        action,
        DurabilityLossCondition.OnUse
      );
    }

    if (!durabilityChanges.isEmpty()) {
      gameUpdateCommand.durabilityChanges = durabilityChanges;

      DurabilityChangesByEntityId.ApplyToGame(party, durabilityChanges);
    }
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions(): Error | ActionIntentAndUser[] {
    return this.branchingActions;
  }
}
