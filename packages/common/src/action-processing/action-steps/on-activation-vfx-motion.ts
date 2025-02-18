import { Vector3 } from "@babylonjs/core";
import {
  ActionMotionPhase,
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
import { getTranslationTime } from "../../combat/combat-actions/action-implementations/get-translation-time.js";

const stepType = ActionResolutionStepType.OnActivationVfxMotion;
export class OnActivationVfxMotionActionResolutionStep extends ActionResolutionStep {
  private translationOption: null | EntityTranslation = null;
  private originalPosition: Vector3;
  constructor(
    context: ActionResolutionStepContext,
    private vfx: Vfx
  ) {
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

    this.originalPosition = vfx.vfxProperties.position.clone();
    console.log("ORIGINAL VFX POSITION: ", this.originalPosition);

    const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    const destinationGetterOption = action.motionPhasePositionGetters[ActionMotionPhase.Delivery];
    let destinationResult = null;
    if (destinationGetterOption)
      destinationResult = destinationGetterOption(context.combatantContext, actionExecutionIntent);
    if (destinationResult instanceof Error) throw destinationResult;
    if (destinationResult) {
      const translation = {
        destination: destinationResult,
        duration: 5000,
      };
      this.translationOption = translation;
      gameUpdateCommand.translationOption = translation;
    }
  }

  protected onTick(): void {
    if (!this.translationOption) return;

    const normalizedPercentTravelled =
      this.translationOption.duration === 0
        ? 1
        : Math.min(1, this.elapsed / this.translationOption.duration);
    console.log(
      "PERCENT TRAVELLED: ",
      normalizedPercentTravelled,
      "DURATION: ",
      this.translationOption.duration
    );

    const newPosition = Vector3.Lerp(
      this.originalPosition,
      this.translationOption.destination,
      normalizedPercentTravelled
    );

    this.vfx.vfxProperties.position.copyFrom(newPosition);
  }

  setDestination(destination: Vector3) {}

  getTimeToCompletion(): number {
    if (this.translationOption) return Math.max(0, this.translationOption.duration - this.elapsed);
    else return 0;
  }

  protected getBranchingActions = () => [];
}
