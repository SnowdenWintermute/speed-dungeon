import { Vector3 } from "@babylonjs/core";
import { Milliseconds } from "../primatives";
import { Combatant } from "../combatants";
import { CombatActionComponent } from "../combat";
import { ReplayEventNode } from "./replay-events";
import { GameUpdateCommand, GameUpdateCommandType } from "./game-update-commands";
import { CombatantAssociatedData } from "../types";
import { CombatActionExecutionIntent } from "../combat/combat-actions/combat-action-execution-intent";

export interface ActionExecuting {
  timeStarted: Milliseconds;
  action: CombatActionComponent;
  step: ActionResolutionStep;
  replayNode: ReplayEventNode;
}

export enum ActionResolutionStepType {
  preUsePositioning,
  startUseAnimation,
  payResourceCosts,
  evalOnUseTriggers,
  rollIncomingHitOutcomes,
  evalOnHitOutcomeTriggers,
  postUseAnimation,
  postUsePositioning,
  playMobileVfx,
  playStaticVfx,
}

export type ActionResolutionStepResult = {
  gameUpdateCommand: GameUpdateCommand;
  branchingActions: { user: Combatant; action: CombatActionComponent }[];
  nextStepOption: ActionResolutionStep | null;
};

export abstract class ActionResolutionStep {
  protected elapsed: Milliseconds = 0;
  constructor(public readonly type: ActionResolutionStepType) {}

  tick(ms: Milliseconds) {
    this.elapsed += ms;
    this.onTick();
  }

  protected onTick() {}

  isComplete(): boolean {
    throw new Error("not implemented");
  }

  onComplete(): ActionResolutionStepResult {
    // return new GameUpdateCommands
    // return a list of new branching actions
    throw new Error("not implemented");
  }

  getNextStep(): ActionResolutionStep {
    throw new Error("not implemented");
  }
}

export class PreUsePositioningActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantAssociatedData,
    private destination: Vector3
  ) {
    super(ActionResolutionStepType.preUsePositioning);
  }

  protected onTick(): void {
    // lerp toward destination
  }

  isComplete() {
    return this.combatantContext.combatant.combatantProperties.position === this.destination;
  }

  onComplete() {
    const toReturn: ActionResolutionStepResult = {
      gameUpdateCommand: {
        type: GameUpdateCommandType.CombatantMovement,
        animationName: "Run Forward", // run forward, run backward, run forward injured @TODO -enum
        combatantId: this.combatantContext.combatant.entityProperties.id,
        destination: Vector3.Zero(),
        percentToConsiderAsCompleted: 100,
      },
      branchingActions: [],
      nextStepOption: 
    };
    return toReturn;
  }
}

export class StartUseAnimationActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private destinationOption: null | Vector3,
  ) {
    super(ActionResolutionStepType.startUseAnimation);
  }

  isComplete() {
    return this.elapsed >= this.duration;
  }

  onComplete() {
    const toReturn: ActionResolutionStepResult = {
      gameUpdateCommand: {
        type: GameUpdateCommandType.CombatantMovement,
        animationName: "Run Forward", // run forward, run backward, run forward injured @TODO -enum
        combatantId: this.combatantContext.combatant.entityProperties.id,
        destination: Vector3.Zero(),
        percentToConsiderAsCompleted: 100,
      },
      branchingActions: [],
      nextStepOption: 
    };
    return toReturn;
  }
}

// export class PayResourceCostsActionResolutionStep extends ActionResolutionStep {
//   constructor(
//     private combatant: Combatant,
//     private action: CombatActionComponent
//   ) {
//     super(ActionResolutionStepType.payResourceCosts);
//   }

//   isComplete(): boolean {
//     return true;
//   }

//   onComplete(): void {
//     const costs = this.action.getResourceCosts(this.combatant.combatantProperties);
//     // get costs from this.action
//     // deduct costs from combatant resources
//     // return GameUpdateCommands
//   }
// }

// export class EvalOnUseTriggersActionResolutionStep extends ActionResolutionStep {
//   constructor(
//     private combatantContext: CombatantAssociatedData,
//     private action: CombatActionComponent
//   ) {
//     super(ActionResolutionStepType.payResourceCosts);
//   }

//   isComplete(): boolean {
//     return true;
//   }

//   onComplete(): void {
//     // collect all triggered actions
//   }
// }
