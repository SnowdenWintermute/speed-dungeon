import { Milliseconds } from "../../primatives/index.js";
import { Combatant } from "../../combatants/index.js";
import { CombatActionComponent } from "../../combat/index.js";
import { ReplayEventNode } from "../replay-events.js";
import { GameUpdateCommand } from "../game-update-commands.js";
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

export const ACTION_RESOLUTION_STEP_TYPE_STRINGS: Record<ActionResolutionStepType, string> = {
  [ActionResolutionStepType.preUsePositioning]: "preUsePositioning",
  [ActionResolutionStepType.startUseAnimation]: "startUseAnimation",
  [ActionResolutionStepType.payResourceCosts]: "payResourceCosts",
  [ActionResolutionStepType.evalOnUseTriggers]: "evalOnUseTriggers",
  [ActionResolutionStepType.rollIncomingHitOutcomes]: "rollIncomingHitOutcomes",
  [ActionResolutionStepType.evalOnHitOutcomeTriggers]: "evalOnHitOutcomeTriggers",
  [ActionResolutionStepType.postUseAnimation]: "postUseAnimation",
  [ActionResolutionStepType.postUsePositioning]: "postUsePositioning",
  [ActionResolutionStepType.playMobileVfx]: "playMobileVfx",
  [ActionResolutionStepType.playStaticVfx]: "playStaticVfx",
};

export type ActionResolutionStepResult = {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[];
  nextStepOption: ActionResolutionStep | null;
};

export abstract class ActionResolutionStep {
  protected elapsed: Milliseconds = 0;
  constructor(
    public readonly type: ActionResolutionStepType,
    protected gameUpdateCommand: GameUpdateCommand
  ) {}

  tick(ms: Milliseconds) {
    console.log("ticked ", ms);
    this.elapsed += ms;
    this.onTick();
  }

  protected abstract onTick(): void;
  abstract getTimeToCompletion(): Milliseconds;
  abstract isComplete(): boolean;
  /**Return branching actions and next step */
  protected abstract onComplete(): ActionResolutionStepResult;

  /**Mark the gameUpdateCommand's completionOrderId and get branching actions and next step*/
  finalize(completionOrderId: number): ActionResolutionStepResult {
    this.gameUpdateCommand.completionOrderId = completionOrderId;
    return this.onComplete();
  }

  getGameUpdateCommand(): GameUpdateCommand {
    return this.gameUpdateCommand;
  }
}
