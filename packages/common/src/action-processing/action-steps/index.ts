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
// steps must
// - create an initial gameUpdateCommand
// - write to the gameUpdateCommand when ticked
// - determine any branching sequences
// - determine the next step

// Behavior tree for action with post-chambering projectile
// succeeder
// SEQUENCE
// INITIAL POSITIONING (entityMotion)
// CHAMBERING MOTION (entityMotion)
// POST-CHAMBERING SPAWN ENTITY (spawnEntity)
// DELIVERY MOTION (entityMotion)
// PAY ACTION COSTS (costsPaid)
// ON-ACTIVATION TRIGGERS (activatedTriggers)
// Selector
// - if not countered
//   - create new projectile action branch
// - if countered
//   - do nothing
// POST-USE MOTION (entityMotion)
// POST-USE POSITIONING (entityMotion)
//
// Behavior tree for projectile action
// Sequence
// ON-ACTIVATION SPAWN ENTITY (spawnEntity)
// ON-ACTIVATION VFX MOTION (entityMotion)
// ROLL HIT OUTCOMES (hitOutcomes)
// HIT OUTCOME TRIGGERS (activatedTriggers)

// PRE USE POSITIONING (entityMotion)
//  - get destination from action and targets
//  - move toward a melee target or in case of ranged move a little forward from home position
// PRE-USE MOTION (entityMotion)
//  - ex: raise hand to draw arrow from quiver
//  - ex: bring wand back to where we want to start "magical particles" around the wand
// PRE USE SPAWN ENTITY (spawnEntity)
//  - ex: spawn an arrow parented to the user's hand
//  - ex: spawn a magical particles vfx entity on the user's wand
// CHARGE-UP-TO-ACTIVATE MOTION (entityMotion)
//  - ex: draw bowstring back and animate bow bending
//  - ex: start animating magical particles around the wand
// PAY ACTION COSTS (costsPaid)
//  - get costs from action context
// ON-USE TRIGGERS (activatedTriggers)
//  - roll
//  - post results to action billboard
//  - skip to post-use positioning step if countered
//  - if success, get next step based on action
// ON-USE SPAWN ENTITY (spawnEntity)
//  - ex: spawn a firebolt in front of the wand
// ON USE VFX MOTION (entityMotion)
//  - ex: translate associated projectile toward its target
//  - ex: animate non-projectile spellcasting effect around targets
// ROLL HIT OUTCOMES (hitOutcomes)
// HIT OUTCOME TRIGGERS (activatedTriggers)
//  - may cause branching actions
// POST-USE MOTION (entityMotion)
//  - check billboard - may be affected by on-use triggers
//  - skip to post-use positioning step if countered
//  - if success, get next step based on action
//  - if there is a counterattack on the billboard
// POST-USE POSITIONING (entityMotion)
export enum ActionMotionPhase {
  Initial,
  Chambering,
  Delivery,
  Recovery,
  Final,
}

export enum ActionResolutionStepType {
  DetermineChildActions,
  InitialPositioning, // motion
  ChamberingMotion, // motion
  PostChamberingSpawnEntity,
  DeliveryMotion, // motion
  PayResourceCosts,
  EvalOnUseTriggers,
  StartConcurrentSubActions,
  OnActivationSpawnEntity,
  OnActivationVfxMotion,
  RollIncomingHitOutcomes,
  EvalOnHitOutcomeTriggers,
  RecoveryMotion, // motion
  FinalPositioning, // motion
}

export const ACTION_RESOLUTION_STEP_TYPE_STRINGS: Record<ActionResolutionStepType, string> = {
  [ActionResolutionStepType.DetermineChildActions]: "determineChildActions",
  [ActionResolutionStepType.InitialPositioning]: "initialPositioning",
  [ActionResolutionStepType.ChamberingMotion]: "chamberingMotion",
  [ActionResolutionStepType.PostChamberingSpawnEntity]: "postChamberingSpawnEntity",
  [ActionResolutionStepType.DeliveryMotion]: "deliveryMotion",
  [ActionResolutionStepType.PayResourceCosts]: "payResourceCosts",
  [ActionResolutionStepType.EvalOnUseTriggers]: "evalOnUseTriggers",
  [ActionResolutionStepType.StartConcurrentSubActions]: "StartConcurrentSubActions",
  [ActionResolutionStepType.OnActivationSpawnEntity]: "onActivationSpawnEntity",
  [ActionResolutionStepType.OnActivationVfxMotion]: "onActivationVfxMotion",
  [ActionResolutionStepType.RollIncomingHitOutcomes]: "rollIncomingHitOutcomes",
  [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: "evalOnHitOutcomeTriggers",
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
  isComplete() {
    console.log(
      "checking time to completion: ",
      ACTION_RESOLUTION_STEP_TYPE_STRINGS[this.type],
      this.getTimeToCompletion()
    );
    return this.getTimeToCompletion() <= 0;
  }
  /**Return branching actions and next step */
  protected abstract getBranchingActions():
    | Error
    | {
        user: Combatant;
        actionExecutionIntent: CombatActionExecutionIntent;
      }[];

  /**Mark the gameUpdateCommand's completionOrderId and get branching actions and next step*/
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
