import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import {
  EntityTranslation,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import { Vfx } from "../../vfx/index.js";
import { SpawnableEntityType } from "../../spawnables/index.js";

const stepType = ActionResolutionStepType.OnActivationVfxMotion;
export class OnActivationVfxMotionActionResolutionStep extends ActionResolutionStep {
  private translationOption: null | EntityTranslation = null;
  private originalPosition: Vector3;
  constructor(context: ActionResolutionStepContext, vfx: Vfx) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,
      completionOrderId: null,
      entityType: SpawnableEntityType.Vfx,
      entityId: vfx.entityProperties.id,
    };

    super(stepType, context, gameUpdateCommand);

    const { combatantProperties } = context.combatantContext.combatant;
    const { actionExecutionIntent } = context.tracker;

    this.originalPosition = combatantProperties.position.clone();

    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
  }

  protected onTick(): void {
    // translate
  }

  setDestination(destination: Vector3) {}

  getTimeToCompletion(): number {
    if (this.translationOption) return Math.max(0, this.translationOption.duration - this.elapsed);
    else return 0;
  }

  protected getBranchingActions = () => [];
}
