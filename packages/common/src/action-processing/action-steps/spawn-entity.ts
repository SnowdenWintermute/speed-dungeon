import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import { MobileVfxName, Vfx, VfxType } from "../../vfx/index.js";

export class SpawnEntityActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext, step: ActionResolutionStepType) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    // @TODO - determine based on action step entity to spawn method method
    const entity: Vfx = {
      entityProperties: { id: context.idGenerator.generate(), name: "" },
      vfxProperties: {
        vfxType: VfxType.Mobile,
        name: MobileVfxName.Arrow,
      },
    };

    context.tracker.spawnedEntityOption = entity;

    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.SpawnEntity,
      step,
      completionOrderId: null,
      entity,
    };

    super(step, context, gameUpdateCommand);
  }

  protected onTick(): void {}

  getTimeToCompletion(): number {
    return 0;
  }

  isComplete() {
    return this.getTimeToCompletion() <= 0;
  }

  protected getBranchingActions = () => [];
}
