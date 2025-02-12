import { Vector3 } from "@babylonjs/core";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { RollIncomingHitOutcomesActionResolutionStep } from "./roll-incoming-hit-outcomes.js";
import { VfxProperties } from "../../vfx/index.js";
import { IdGenerator } from "../../utility-classes/index.js";

const stepType = ActionResolutionStepType.spawnEntity;

export class SpawnEntityActionResolutionStep extends ActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext,
    private startPosition: Vector3,
    private destination: Vector3,
    private translationDuration: number,
    idGenerator: IdGenerator,
    vfxProperties: VfxProperties
  ) {
    const entityProperties = { id: idGenerator.generate(), name: "" };
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.SpawnEntity,
      step: stepType,
      completionOrderId: null,
      entity: {
        entityProperties,
        vfxProperties,
      },
    };

    super(stepType, context, gameUpdateCommand);
  }

  protected onTick(): void {
    const normalizedPercentTravelled = this.elapsed / this.translationDuration;

    const newPosition = Vector3.Lerp(
      this.startPosition,
      this.destination,
      normalizedPercentTravelled
    );

    this.context.combatantContext.combatant.combatantProperties.position.copyFrom(newPosition);
  }

  getTimeToCompletion(): number {
    return Math.max(0, this.translationDuration - this.elapsed);
  }

  isComplete() {
    return this.elapsed >= this.translationDuration;
  }

  onComplete(): ActionResolutionStepResult {
    // could determine next step dynamically here
    return {
      branchingActions: [],
      nextStepOption: new RollIncomingHitOutcomesActionResolutionStep(this.context),
    };
  }
}
