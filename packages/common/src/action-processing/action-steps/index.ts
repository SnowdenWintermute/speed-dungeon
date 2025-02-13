import { Milliseconds } from "../../primatives/index.js";
import { Combatant } from "../../combatants/index.js";
import { CombatActionComponent } from "../../combat/index.js";
import { ReplayEventNode } from "../replay-events.js";
import { GameUpdateCommand } from "../game-update-commands.js";
import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { ActionSequenceManager } from "../action-sequence-manager.js";

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

export enum ActionResolutionStepType {
  determineChildActions,
  initialPositioning,
  chamberingMotion,
  chamberingSpawnEntity,
  deliveryMotion,
  payResourceCosts,
  evalOnUseTriggers,
  onActivationSpawnEntity,
  onActivationVfxMotion,
  rollIncomingHitOutcomes,
  evalOnHitOutcomeTriggers,
  recoveryMotion,
  finalPositioning,
}

export const ACTION_RESOLUTION_STEP_TYPE_STRINGS: Record<ActionResolutionStepType, string> = {
  [ActionResolutionStepType.determineChildActions]: "determineChildActions",
  [ActionResolutionStepType.initialPositioning]: "initialPositioning",
  [ActionResolutionStepType.chamberingMotion]: "chamberingMotion",
  [ActionResolutionStepType.chamberingSpawnEntity]: "chamberingSpawnEntity",
  [ActionResolutionStepType.deliveryMotion]: "deliveryMotion",
  [ActionResolutionStepType.payResourceCosts]: "payResourceCosts",
  [ActionResolutionStepType.evalOnUseTriggers]: "evalOnUseTriggers",
  [ActionResolutionStepType.onActivationSpawnEntity]: "onActivationSpawnEntity",
  [ActionResolutionStepType.onActivationVfxMotion]: "onActivationVfxMotion",
  [ActionResolutionStepType.rollIncomingHitOutcomes]: "rollIncomingHitOutcomes",
  [ActionResolutionStepType.evalOnHitOutcomeTriggers]: "evalOnHitOutcomeTriggers",
  [ActionResolutionStepType.recoveryMotion]: "recoveryMotion",
  [ActionResolutionStepType.finalPositioning]: "finalPositioning",
};

export type ActionResolutionStepResult = {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[];
  nextStepOption: ActionResolutionStep | null;
};

export interface ActionResolutionStepContext {
  combatantContext: CombatantContext;
  actionExecutionIntent: CombatActionExecutionIntent;
  manager: ActionSequenceManager;
  previousStepOption: null | ActionResolutionStep;
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
  abstract isComplete(): boolean;
  /**Return branching actions and next step */
  protected abstract getNextStepOption(): Error | null | ActionResolutionStep;
  protected abstract getBranchingActions():
    | Error
    | {
        user: Combatant;
        actionExecutionIntent: CombatActionExecutionIntent;
      }[];

  /**Mark the gameUpdateCommand's completionOrderId and get branching actions and next step*/
  finalize(completionOrderId: number): Error | ActionResolutionStepResult {
    if (this.gameUpdateCommandOption)
      this.gameUpdateCommandOption.completionOrderId = completionOrderId;
    return this.onComplete();
  }

  getGameUpdateCommandOption(): null | GameUpdateCommand {
    return this.gameUpdateCommandOption;
  }

  onComplete(): Error | ActionResolutionStepResult {
    const branchingActionsResult = this.getBranchingActions();
    if (branchingActionsResult instanceof Error) return branchingActionsResult;
    const nextStepOptionResult = this.getNextStepOption();
    if (nextStepOptionResult instanceof Error) return nextStepOptionResult;
    return { branchingActions: branchingActionsResult, nextStepOption: nextStepOptionResult };
  }
}
