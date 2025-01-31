import { Vector3 } from "@babylonjs/core";
import { Milliseconds } from "../../primatives/index.js";
import { Combatant } from "../../combatants/index.js";
import { COMBAT_ACTIONS, CombatActionComponent } from "../../combat/index.js";
import { ReplayEventNode } from "../replay-events.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { CombatantAssociatedData } from "../../types.js";
import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";

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

  protected abstract onTick(): void;
  abstract getTimeToCompletion(): Milliseconds;
  abstract isComplete(): boolean;
  /**Used to create and set the internal reference to the associated game update command, as well as
   * apply updates to game state for instantly processed steps*/
  protected abstract initialize(): GameUpdateCommand;
  /** Assign the completionOrderId to our held reference of associated game update,
   * and return branching actions and next step */
  protected abstract onComplete(): ActionResolutionStepResult;

  finalize(completionOrderId: number): ActionResolutionStepResult {
    this.gameUpdateCommand.completionOrderId = completionOrderId;
    return this.onComplete();
  }

  getGameUpdateCommand(): GameUpdateCommand {
    return this.gameUpdateCommand;
  }
}

export class PreUsePositioningActionResolutionStep extends ActionResolutionStep {
  private destination: Vector3;
  private originalPosition: Vector3;
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent
  ) {
    super(ActionResolutionStepType.preUsePositioning);

    this.originalPosition = combatantContext.combatant.combatantProperties.position.clone();
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

  getTimeToCompletion(): number {
    throw new Error("Method not implemented.");
  }

  isComplete() {
    return this.combatantContext.combatant.combatantProperties.position === this.destination;
  }

  getGameUpdateCommand(): GameUpdateCommand {
    return this.gameUpdateCommand;
  }

  onComplete(): ActionResolutionStepResult {
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

  protected onTick(): void {
    // @TODO -lerp combatant toward destination
  }

  getTimeToCompletion(): number {
    // @TODO - determine based on how long we want the animation to take
    // - action type
    // - combatant speed
    throw new Error("Method not implemented.");
  }

  isComplete() {
    return this.elapsed >= this.duration;
  }

  onComplete(): ActionResolutionStepResult {
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

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

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
    super(ActionResolutionStepType.evalOnUseTriggers);
  }

  protected initialize(): GameUpdateCommand {
    // counterspells
    throw new Error("Method not implemented.");
  }
  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  onComplete(): ActionResolutionStepResult {
    // @TODO - set any sub actions to the branchingActions list
    // @TODO - collect all triggered actions and add to branchingActions list
    // @TODO - determine next step based on action type:
    // ex: if countered, skip the rollIncomingHitOutcomes step and go to postUseAnimation with a countered animation
    // and push a GameUpdateCommand with the counter animation for the countering combatant
    return {
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

  protected initialize(): GameUpdateCommand {
    // @TODO - calculate hits, evades, parries, blocks, hp/mp/shard/durability changes to apply
    // and pass them to the next step for triggers and filtering
    return {
      type: GameUpdateCommandType.HitOutcomes,
      completionOrderId: null,
      actionName: this.actionExecutionIntent.actionName,
      // hits, misses, evades, parries, blocks
    };
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new EvalOnHitOutcomeTriggersActionResolutionStep(
        this.combatantContext,
        this.actionExecutionIntent
      ),
    };
  }
}

export class EvalOnHitOutcomeTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantAssociatedData,
    private actionExecutionIntent: CombatActionExecutionIntent
    // hits, misses, evades, parries, blocks (used for determining triggers as well as user followthrough animation)
  ) {
    super(ActionResolutionStepType.evalOnHitOutcomeTriggers);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected initialize(): GameUpdateCommand {
    // @TODO - collect all triggered actions and add to branchingActions list
    // @TODO - determine next step based on action type:
    throw new Error("Method not implemented.");
  }
  protected onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new PostUseAnimationActionResolutionStep(
        this.combatantContext,
        null,
        "Sword strike rebound | Sword strike followthrough"
      ),
    };
  }
}

export class PostUseAnimationActionResolutionStep extends ActionResolutionStep {
  duration: Milliseconds;
  constructor(
    private combatantContext: CombatantAssociatedData,
    private destinationOption: null | Vector3,
    private animationName: string
  ) {
    super(ActionResolutionStepType.postUseAnimation);

    // @TODO -calculate duration based distance to destination dictated by action and target
    this.duration = 1000;
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

  protected onTick(): void {
    // @TODO -lerp combatant toward destination
  }

  getTimeToCompletion(): number {
    // @TODO - determine based on how long we want the animation to take
    // - action type
    // - combatant speed
    throw new Error("Method not implemented.");
  }

  isComplete() {
    return this.elapsed >= this.duration;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new PostUsePositioningActionResolutionStep(this.combatantContext, "Run back"),
    };
  }
}

export class PostUsePositioningActionResolutionStep extends ActionResolutionStep {
  private destination: Vector3;
  private originalPosition: Vector3;
  constructor(
    private combatantContext: CombatantAssociatedData,
    public animationName: string
  ) {
    super(ActionResolutionStepType.postUsePositioning);

    this.originalPosition = combatantContext.combatant.combatantProperties.position.clone();
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

  getTimeToCompletion(): number {
    throw new Error("Method not implemented.");
  }

  isComplete() {
    return this.combatantContext.combatant.combatantProperties.position === this.destination;
  }

  getGameUpdateCommand(): GameUpdateCommand {
    return this.gameUpdateCommand;
  }

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: null,
    };
  }
}

// in case of projectile - playMobileVfx,
// in case of spell effect - playStaticVfx,
