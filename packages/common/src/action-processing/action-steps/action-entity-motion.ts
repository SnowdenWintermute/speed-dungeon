import { ActionResolutionStepContext, ActionResolutionStepType } from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { ARROW_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { CombatActionAnimationPhase } from "../../combat/index.js";
import { ActionEntity, ActionEntityName } from "../../action-entities/index.js";

export class ActionEntityMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext,
    stepType: ActionResolutionStepType,
    animationPhase: CombatActionAnimationPhase,
    actionEntity: ActionEntity
  ) {
    // @TODO - some should not despawn such as explosion which needs to do a recovery animation
    const despawnOnComplete =
      actionEntity.actionEntityProperties.name === ActionEntityName.Arrow ||
      actionEntity.actionEntityProperties.name === ActionEntityName.IceBolt ||
      animationPhase === CombatActionAnimationPhase.RecoverySuccess ||
      animationPhase === CombatActionAnimationPhase.RecoveryInterrupted;

    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,
      actionName: context.tracker.actionExecutionIntent.actionName,
      completionOrderId: null,
      entityType: SpawnableEntityType.ActionEntity,
      entityId: actionEntity.entityProperties.id,
      despawnOnComplete,
    };

    super(
      stepType,
      context,
      animationPhase,
      gameUpdateCommand,
      actionEntity.actionEntityProperties.position,
      ARROW_TIME_TO_MOVE_ONE_METER
    );
  }
  protected getBranchingActions = () => [];
}
