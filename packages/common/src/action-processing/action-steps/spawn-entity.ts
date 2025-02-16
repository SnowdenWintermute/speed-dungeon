import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { MobileVfxName, Vfx, VfxType } from "../../vfx/index.js";
import { ActionTracker } from "../action-tracker.js";

export class SpawnEntityActionResolutionStep extends ActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext,
    tracker: ActionTracker,
    step: ActionResolutionStepType,
    idGenerator: IdGenerator
  ) {
    const action = COMBAT_ACTIONS[context.actionExecutionIntent.actionName];
    // @TODO - determine based on action step entity to spawn method method
    const entity: Vfx = {
      entityProperties: { id: idGenerator.generate(), name: "" },
      vfxProperties: {
        vfxType: VfxType.Mobile,
        name: MobileVfxName.Arrow,
      },
    };

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
