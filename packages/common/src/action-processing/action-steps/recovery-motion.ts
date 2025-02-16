import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import {
  EntityAnimation,
  EntityTranslation,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";

const stepType = ActionResolutionStepType.RecoveryMotion;
export class RecoveryMotionActionResolutionStep extends ActionResolutionStep {
  private translationOption: null | EntityTranslation = null;
  private animationOption: null | EntityAnimation = null;
  private originalPosition: Vector3;
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.EntityMotion,
      step: stepType,
      completionOrderId: null,
      entityId: context.combatantContext.combatant.entityProperties.id,
    };

    super(stepType, context, gameUpdateCommand);

    const { combatantProperties } = context.combatantContext.combatant;

    this.originalPosition = combatantProperties.position.clone();
    const action = COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName];

    // get recovery animation name
    // get recovery motion destination option
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
