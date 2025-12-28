import { ActionResolutionStepContext, ActionResolutionStepType } from "../index.js";
import {
  CombatantMotionGameUpdateCommand,
  CombatantMotionUpdate,
  GameUpdateCommandType,
} from "../../game-update-commands.js";
import { SpawnableEntityType } from "../../../spawnables/index.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { SceneEntityType } from "../../../scene-entities/index.js";
import { COMBAT_ACTIONS } from "../../../combat/combat-actions/action-implementations/index.js";

export class CombatantMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    const { actionName } = context.tracker.actionExecutionIntent;

    const { actionUser } = context.actionUserContext;

    const update: CombatantMotionUpdate = {
      entityType: SpawnableEntityType.Combatant,
      entityId: actionUser.getEntityId(),
      idleOnComplete: step === ActionResolutionStepType.FinalPositioning,
    };

    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const stepConfig = action.stepsConfig.getStepConfigOption(step);
    if (!stepConfig) throw new Error("expected step config not found");

    if (stepConfig.shouldIdleOnComplete === false) {
      update.idleOnComplete = false;
    }

    // I want to be able to update "attached combatant" positions which are parented to this combatant
    // so when we attack them we get their proper positions as destinations
    if (stepConfig.getNewParent) {
      const newParent = stepConfig.getNewParent(context);
      update.setParent = newParent;

      if (newParent?.identifier.sceneEntityIdentifier.type === SceneEntityType.CharacterModel) {
        const combatantId = newParent?.identifier.sceneEntityIdentifier.entityId;
        context.actionUserContext.party.combatantManager
          .getExpectedCombatant(combatantId)
          .getCombatantProperties()
          .transformProperties.setAttachedCombatant(actionUser.getEntityId());
      }
    }

    if (stepConfig.shouldIdleOnComplete) update.idleOnComplete = true;

    if (stepConfig.getEquipmentAnimations)
      update.equipmentAnimations = stepConfig.getEquipmentAnimations(
        actionUser,
        context.manager.sequentialActionManagerRegistry.animationLengths
      );

    /**Here we create and set the internal reference to the associated game update command, as well as
     * apply updates to game state for instantly processed steps*/
    const gameUpdateCommand: CombatantMotionGameUpdateCommand = {
      type: GameUpdateCommandType.CombatantMotion,
      actionName,
      step,
      completionOrderId: null,
      mainEntityUpdate: update,
    };

    super(step, context, gameUpdateCommand, actionUser);
  }
}
