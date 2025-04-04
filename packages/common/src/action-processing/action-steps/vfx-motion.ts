import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionMotionPhase,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { MobileVfxName, Vfx } from "../../vfx/index.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { ARROW_TIME_TO_MOVE_ONE_METER } from "../../app-consts.js";
import { EntityMotionActionResolutionStep } from "./entity-motion.js";
import { CombatActionAnimationPhase } from "../../combat/index.js";

export class VfxMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext,
    stepType: ActionResolutionStepType,
    actionMotionPhase: ActionMotionPhase,
    animationPhase: CombatActionAnimationPhase,
    vfx: Vfx
  ) {
    // @TODO - some should not despawn such as explosion which needs to do a recovery animation
    const despawnOnComplete =
      vfx.vfxProperties.name === MobileVfxName.Arrow ||
      animationPhase === CombatActionAnimationPhase.RecoverySuccess ||
      animationPhase === CombatActionAnimationPhase.RecoveryInterrupted;

    console.log("vfx motion for step", ACTION_RESOLUTION_STEP_TYPE_STRINGS[stepType]);

    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,
      completionOrderId: null,
      entityType: SpawnableEntityType.Vfx,
      entityId: vfx.entityProperties.id,
      despawnOnComplete,
    };

    super(
      stepType,
      context,
      actionMotionPhase,
      animationPhase,
      gameUpdateCommand,
      vfx.vfxProperties.position,
      ARROW_TIME_TO_MOVE_ONE_METER
    );
  }
  protected getBranchingActions = () => [];
}
