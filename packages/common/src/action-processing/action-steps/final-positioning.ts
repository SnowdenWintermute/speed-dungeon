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

const stepType = ActionResolutionStepType.finalPositioning;
export class FinalPositioningPositioningActionResolutionStep extends ActionResolutionStep {
  private translationOption: null | EntityTranslation = null;
  private animationOption: null | EntityAnimation = null;
  private originalPosition: Vector3;
  constructor(context: ActionResolutionStepContext) {
    /**Here we create and set the internal reference to the associated game update command, as well as
     * apply updates to game state for instantly processed steps*/
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

    // get chambering animation name
    // get chambering motion destination option

    // TRANSLATION
    // this.destination = gameUpdateCommand.destination = combatantProperties.homeLocation.clone();
    // let distance = Vector3.Distance(this.originalPosition, this.destination);
    // if (isNaN(distance)) distance = 0;
    // const speedMultiplier = 1;
    // this.timeToTranslate = gameUpdateCommand.duration =
    //   COMBATANT_TIME_TO_MOVE_ONE_METER * speedMultiplier * distance;
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
