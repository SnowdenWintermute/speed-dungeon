import { Vector3 } from "@babylonjs/core";
import { Milliseconds } from "../primatives";
import { Combatant } from "../combatants";
import { CombatActionComponent } from "../combat";
import { CombatantAssociatedData } from "../types";
import { ReplayEventNode } from "./replay-events";
import { GameUpdateCommand } from "./game-update-commands";

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

  onComplete(): {
    gameUpdateCommands: GameUpdateCommand;
    branchingActions: { user: Combatant; action: CombatActionComponent }[];
  } {
    // return new GameUpdateCommands
    // return a list of new branching actions
    throw new Error("not implemented");
  }
}

export class PreUsePositioningActionResolutionStep extends ActionResolutionStep {
  constructor(
    public replayNode: ReplayEventNode,
    private combatant: Combatant,
    private destination: Vector3
  ) {
    super(ActionResolutionStepType.preUsePositioning);
  }

  protected onTick(): void {
    // lerp toward destination
  }

  isComplete(): boolean {
    return this.combatant.combatantProperties.position === this.destination;
  }

  onComplete(): void {}
}

export class StartUseAnimationActionResolutionStep extends ActionResolutionStep {
  constructor(
    public replayNode: ReplayEventNode,
    private combatant: Combatant, // could use their speed attribute
    private duration: Milliseconds
  ) {
    super(ActionResolutionStepType.startUseAnimation);
  }

  isComplete(): boolean {
    return this.elapsed >= this.duration;
  }

  onComplete(): void {}
}

export class PayResourceCostsActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatant: Combatant,
    private action: CombatActionComponent
  ) {
    super(ActionResolutionStepType.payResourceCosts);
  }

  isComplete(): boolean {
    return true;
  }

  onComplete(): void {
    const costs = this.action.getResourceCosts(this.combatant.combatantProperties);
    // get costs from this.action
    // deduct costs from combatant resources
    // return GameUpdateCommands
  }
}

export class EvalOnUseTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(
    private combatantContext: CombatantAssociatedData,
    private action: CombatActionComponent
  ) {
    super(ActionResolutionStepType.payResourceCosts);
  }

  isComplete(): boolean {
    return true;
  }

  onComplete(): void {
    // collect all triggered actions
  }
}
