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
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[];
  nextStepOption: ActionResolutionStep | null;
};

export abstract class ActionResolutionStep {
  protected elapsed: Milliseconds = 0;
  protected gameUpdateCommand: GameUpdateCommand;
  constructor(public readonly type: ActionResolutionStepType) {
    this.gameUpdateCommand = this.initialize();
  }

  tick(ms: Milliseconds) {
    this.elapsed += ms;
    this.onTick();
  }

  protected onTick() {}

  getTimeToCompletion(): Milliseconds {
    throw new Error("not implemented");
  }

  isComplete(): boolean {
    throw new Error("not implemented");
  }

  /** Used to create and set the internal reference to the associated game update command */
  protected initialize(): GameUpdateCommand {
    throw new Error("not implemented");
  }

  getGameUpdateCommand(): GameUpdateCommand {
    return this.gameUpdateCommand;
  }

  markGameUpdateAsCompleted(completionOrderId: number): void {
    this.gameUpdateCommand.completionOrderId = completionOrderId;
  }

  /** Assign the completionOrderId to our held reference of associated game update,
   * and return branching actions and next step */
  onComplete(completionOrderId: number): ActionResolutionStepResult {
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

  protected initialize(): GameUpdateCommand {
    return {
      type: GameUpdateCommandType.CombatantMovement,
      completionOrderId: null,
      animationName: "Run Forward", // run forward, run backward, run forward injured @TODO -enum
      combatantId: this.combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
    };
  }

  protected onTick(): void {
    // @TODO -lerp combatant toward destination
  }

  isComplete() {
    return this.combatantContext.combatant.combatantProperties.position === this.destination;
  }

  getGameUpdateCommand(): GameUpdateCommand {
    return this.gameUpdateCommand;
  }

  onComplete(completionOrderId: number): ActionResolutionStepResult {
    super.markGameUpdateAsCompleted(completionOrderId);

    return {
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

  protected initialize(): GameUpdateCommand {
    return {
      type: GameUpdateCommandType.CombatantAnimation,
      completionOrderId: null,
      animationName: "Raise and Draw Bow",
      combatantId: this.combatantContext.combatant.entityProperties.id,
      destination: Vector3.Zero(),
      duration: 1000,
    };
  }

  isComplete() {
    return this.elapsed >= this.duration;
  }

  onComplete(completionOrderId: number): ActionResolutionStepResult {
    this.markGameUpdateAsCompleted(completionOrderId);

    return {
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

  protected initialize(): GameUpdateCommand {
    // @TODO - calculate the actual costs paid
    // @TODO - apply the deducted costs to server game state combatant resources
    //
    return {
      type: GameUpdateCommandType.ResourcesPaid,
      completionOrderId: null,
      combatantId: this.combatantContext.combatant.entityProperties.id,
      costsPaid: {},
    };
  }

  isComplete(): boolean {
    return true;
  }

  onComplete(): ActionResolutionStepResult {
    const action = COMBAT_ACTIONS[this.actionExecutionIntent.actionName];
    const costs = action.getResourceCosts(this.combatantContext.combatant.combatantProperties);

    return {
      branchingActions: [],
      nextStepOption: new EvalOnUseTriggersActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent
      ),
    };
  }
}

export class EvalOnUseTriggersActionResolutionStep extends ActionResolutionStep {
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
    // @TODO - collect all triggered actions and add to branchingActions list
    // @TODO - set any sub actions to the branchingActions list
    // @TODO - determine next step based on action type:
    // ex: if countered, skip the rollIncomingHitOutcomes step and go to postUseAnimation with a countered animation
    // and push a GameUpdateCommand with the counter animation for the countering combatant
    return {
      gameUpdateCommands: [
        {
          type: GameUpdateCommandType.ResourcesPaid,
          combatantId: this.combatantContext.combatant.entityProperties.id,
          costsPaid: {},
        },
      ],
      branchingActions: [], // split arrow, split arrow, split arrow
      // in case of subActions, skip to post use animation
      nextStepOption: new RollIncomingHitOutcomesActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent
      ),
    };
  }
}

export class RollIncomingHitOutcomesActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent
  ) {
    super(ActionResolutionStepType.payResourceCosts);
  }

  // @TODO - calculate hits, evades, parries, blocks, hp/mp/shard/durability changes to apply
  // and pass them to the next step for triggers and filtering

  isComplete(): boolean {
    return true;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      gameUpdateCommands: [
        {
          type: GameUpdateCommandType.HitOutcomes,
          actionName: this.actionExecutionIntent.actionName,
          // hits, misses, evades, parries, blocks
        },
      ],
      branchingActions: [],
      nextStepOption: null,
    };
  }
}

// in case of projectile - playMobileVfx,
// in case of spell effect - playStaticVfx,
// rollIncomingHitOutcomes,
// evalOnHitOutcomeTriggers,
// postUseAnimation,
// postUsePositioning,
//
//
// , blocked, parried, should spawn projectile, should spawn spell effect
