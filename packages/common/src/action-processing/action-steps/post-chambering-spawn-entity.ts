import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { MobileVfxName, Vfx, VfxType } from "../../vfx/index.js";

const stepType = ActionResolutionStepType.postChamberingSpawnEntity;
export class PostChamberingSpawnEntityActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext, idGenerator: IdGenerator) {
    const action = COMBAT_ACTIONS[context.actionExecutionIntent.actionName];
    // @TODO - determine based on action getPostChamberingEntityToSpawn method
    const entity: Vfx = {
      entityProperties: { id: idGenerator.generate(), name: "" },
      vfxProperties: {
        vfxType: VfxType.Mobile,
        name: MobileVfxName.Arrow,
      },
    };

    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.SpawnEntity,
      step: stepType,
      completionOrderId: null,
      entity,
    };

    super(stepType, context, gameUpdateCommand);
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
