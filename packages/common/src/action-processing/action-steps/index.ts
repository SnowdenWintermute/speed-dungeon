import { Milliseconds } from "../../primatives/index.js";
import { Combatant } from "../../combatants/index.js";
import { CombatActionComponent } from "../../combat/index.js";
import { ReplayEventNode } from "../replay-events.js";
import { GameUpdateCommand } from "../game-update-commands.js";
import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { ActionSequenceManager } from "../action-sequence-manager.js";
import { ActionTracker } from "../action-tracker.js";
import { IdGenerator } from "../../utility-classes/index.js";

export interface ActionExecuting {
  timeStarted: Milliseconds;
  action: CombatActionComponent;
  step: ActionResolutionStep;
  replayNode: ReplayEventNode;
}
export enum ActionMotionPhase {
  Initial,
  Chambering,
  Delivery,
  Recovery,
  Final,
}

export enum ActionResolutionStepType {
  DetermineChildActions,
  DetermineActionAnimations,
  InitialPositioning, // motion - start magical glyph ClientOnlyVfx
  ChamberingMotion, // motion - start frost particle accumulation ClientOnlyVfx
  PostChamberingSpawnEntity,
  DeliveryMotion, // motion - start frost particle burst ClientOnlyVfx
  PayResourceCosts,
  EvalOnUseTriggers,
  StartConcurrentSubActions,
  OnActivationSpawnEntity,
  OnActivationVfxMotion, // motion
  RollIncomingHitOutcomes,
  EvalOnHitOutcomeTriggers,
  VfxDisspationMotion, // motion
  RecoveryMotion, // motion
  FinalPositioning, // motion
}

export const ACTION_RESOLUTION_STEP_TYPE_STRINGS: Record<ActionResolutionStepType, string> = {
  [ActionResolutionStepType.DetermineChildActions]: "determineChildActions",
  [ActionResolutionStepType.DetermineActionAnimations]: "determineActionAnimations",
  [ActionResolutionStepType.InitialPositioning]: "initialPositioning",
  [ActionResolutionStepType.ChamberingMotion]: "chamberingMotion",
  [ActionResolutionStepType.EvalOnUseTriggers]: "evalOnUseTriggers", // counterspells, branch block/parry/counterattacks, bow durability loss
  [ActionResolutionStepType.PostChamberingSpawnEntity]: "postChamberingSpawnEntity",
  [ActionResolutionStepType.DeliveryMotion]: "deliveryMotion",
  [ActionResolutionStepType.PayResourceCosts]: "payResourceCosts",
  [ActionResolutionStepType.StartConcurrentSubActions]: "StartConcurrentSubActions",
  [ActionResolutionStepType.OnActivationSpawnEntity]: "onActivationSpawnEntity",
  [ActionResolutionStepType.OnActivationVfxMotion]: "onActivationVfxMotion",
  [ActionResolutionStepType.RollIncomingHitOutcomes]: "rollIncomingHitOutcomes",
  [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: "evalOnHitOutcomeTriggers", // lifesteal traits, apply conditions
  [ActionResolutionStepType.VfxDisspationMotion]: "VfxDisspationMotion",
  [ActionResolutionStepType.RecoveryMotion]: "recoveryMotion",
  [ActionResolutionStepType.FinalPositioning]: "finalPositioning",
};

export type ActionResolutionStepResult = {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[];
  nextStepOption: ActionResolutionStep | null;
};

export interface ActionResolutionStepContext {
  combatantContext: CombatantContext;
  tracker: ActionTracker;
  manager: ActionSequenceManager;
  idGenerator: IdGenerator;
}

export abstract class ActionResolutionStep {
  protected elapsed: Milliseconds = 0;
  constructor(
    public readonly type: ActionResolutionStepType,
    protected context: ActionResolutionStepContext,
    protected gameUpdateCommandOption: null | GameUpdateCommand
  ) {}

  getContext() {
    return this.context;
  }

  tick(ms: Milliseconds) {
    this.elapsed += ms;
    this.onTick();
  }

  protected abstract onTick(): void;
  abstract getTimeToCompletion(): Milliseconds;
  isComplete = () => this.getTimeToCompletion() <= 0;

  /**Return branching actions and next step */
  protected abstract getBranchingActions():
    | Error
    | {
        user: Combatant;
        actionExecutionIntent: CombatActionExecutionIntent;
      }[];

  /**Mark the gameUpdateCommand's completionOrderId and get branching actions*/
  finalize(
    completionOrderId: number
  ): Error | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    if (this.gameUpdateCommandOption)
      this.gameUpdateCommandOption.completionOrderId = completionOrderId;
    return this.onComplete();
  }

  getGameUpdateCommandOption(): null | GameUpdateCommand {
    return this.gameUpdateCommandOption;
  }

  onComplete(): Error | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    const branchingActionsResult = this.getBranchingActions();
    if (branchingActionsResult instanceof Error) return branchingActionsResult;
    return branchingActionsResult;
  }
}
