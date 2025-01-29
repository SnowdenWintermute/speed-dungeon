import { Vector3 } from "@babylonjs/core";
import { Milliseconds } from "../primatives/index.js";
import { Combatant } from "../combatants/index.js";
import { COMBAT_ACTIONS, CombatActionComponent } from "../combat/index.js";
import { ReplayEventNode } from "./replay-events.js";
import { GameUpdateCommand, GameUpdateCommandType } from "./game-update-commands.js";
import { CombatantAssociatedData } from "../types.js";
import { CombatActionExecutionIntent } from "../combat/combat-actions/combat-action-execution-intent.js";

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
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[];
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
  private destination: Vector3;
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent
  ) {
    super(ActionResolutionStepType.preUsePositioning);

    // @TODO - calculate destination based on action
    this.destination = Vector3.Zero();
  }

  protected onTick(): void {
    // @TODO -lerp combatant toward destination
  }

  isComplete() {
    return this.combatantContext.combatant.combatantProperties.position === this.destination;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      gameUpdateCommand: {
        type: GameUpdateCommandType.CombatantMovement,
        animationName: "Run Forward", // run forward, run backward, run forward injured @TODO -enum
        combatantId: this.combatantContext.combatant.entityProperties.id,
        destination: Vector3.Zero(),
        percentToConsiderAsCompleted: 100,
      },
      branchingActions: [],
      nextStepOption: new StartUseAnimationActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent,
        Vector3.Zero()
      ),
    };
  }
}

export class StartUseAnimationActionResolutionStep extends ActionResolutionStep {
  duration: Milliseconds;
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private destinationOption: null | Vector3
  ) {
    super(ActionResolutionStepType.startUseAnimation);

    // @TODO -calculate duration based distance to destination dictated by action and target
    this.duration = 1000;
  }

  protected onTick(): void {
    // @TODO -lerp combatant toward destination
  }

  isComplete() {
    return this.elapsed >= this.duration;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      gameUpdateCommand: {
        type: GameUpdateCommandType.CombatantAnimation,
        animationName: "Swing Main Hand",
        combatantId: this.combatantContext.combatant.entityProperties.id,
        destination: Vector3.Zero(),
        duration: 1000,
        percentToConsiderAsCompleted: 100,
      },
      branchingActions: [],
      nextStepOption: new PayResourceCostsActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent
      ),
    };
  }
}

export class PayResourceCostsActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent
  ) {
    super(ActionResolutionStepType.payResourceCosts);
  }

  isComplete(): boolean {
    return true;
  }

  onComplete(): ActionResolutionStepResult {
    const action = COMBAT_ACTIONS[this.actionExecutionIntent.actionName];
    const costs = action.getResourceCosts(this.combatantContext.combatant.combatantProperties);

    // @TODO - calculate the actual costs paid
    // @TODO - deduct costs from combatant resources

    return {
      gameUpdateCommand: {
        type: GameUpdateCommandType.ResourcesPaid,
        combatantId: this.combatantContext.combatant.entityProperties.id,
        costsPaid: {},
      },
      branchingActions: [],
      nextStepOption: null,
    };
  }
}

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

// rollIncomingHitOutcomes,
// evalOnHitOutcomeTriggers,
// postUseAnimation,
// postUsePositioning,
// playMobileVfx,
// playStaticVfx,
