import {
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

const stepType = ActionResolutionStepType.OnActivationVfxMotion;
export class OnActivationVfxMotionActionResolutionStep extends EntityMotionActionResolutionStep {
  constructor(context: ActionResolutionStepContext, vfx: Vfx) {
    // @TODO - some should not despawn such as explosion which needs to do a recovery animation
    const despawnOnComplete = vfx.vfxProperties.name === MobileVfxName.Arrow;

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
      ActionMotionPhase.Delivery,
      CombatActionAnimationPhase.Delivery,
      gameUpdateCommand,
      vfx.vfxProperties.position,
      ARROW_TIME_TO_MOVE_ONE_METER
    );
  }
  protected getBranchingActions = () => [];
}
