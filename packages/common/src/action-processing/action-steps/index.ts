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
// PRE USE SPAWN ENTITY
// START-USE MOTION (entityMotion)
// PAY ACTION COSTS (costsPaid)
//  - get costs from action context
// ON-USE TRIGGERS (activatedTriggers)
//  - roll
//  - post results to action billboard
//  - skip to post-use positioning step if countered
//  - if success, get next step based on action
// ON USE SPAWN ENTITY (spawnEntity)
//  - if action spawns an entity, write it to the billboard
// ON USE VFX MOTION (entityMotion)
//  - check for expected entity on the billboard
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
  preUsePositioning,
  startUseMotion,
  payResourceCosts,
  evalOnUseTriggers,
  preUseSpawnEntity,
  onUseSpawnEntity,
  vfxMotion,
  rollIncomingHitOutcomes,
  evalOnHitOutcomeTriggers,
  postUseMotion,
  postUsePositioning,
}

export const ACTION_RESOLUTION_STEP_TYPE_STRINGS: Record<ActionResolutionStepType, string> = {
  [ActionResolutionStepType.determineChildActions]: "determineChildActions",
  [ActionResolutionStepType.preUsePositioning]: "preUsePositioning",
  [ActionResolutionStepType.startUseMotion]: "startUseMotion",
  [ActionResolutionStepType.payResourceCosts]: "payResourceCosts",
  [ActionResolutionStepType.evalOnUseTriggers]: "evalOnUseTriggers",
  [ActionResolutionStepType.rollIncomingHitOutcomes]: "rollIncomingHitOutcomes",
  [ActionResolutionStepType.evalOnHitOutcomeTriggers]: "evalOnHitOutcomeTriggers",
  [ActionResolutionStepType.postUseMotion]: "postUseMotion",
  [ActionResolutionStepType.postUsePositioning]: "postUsePositioning",
  [ActionResolutionStepType.vfxMotion]: "vfxMotion",
  [ActionResolutionStepType.preUseSpawnEntity]: "preUsespawnEntity",
  [ActionResolutionStepType.onUseSpawnEntity]: "onUseSpawnEntity",
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
    // console.log(
    //   "TICKED ",
    //   ACTION_RESOLUTION_STEP_TYPE_STRINGS[this.type],
    //   ms,
    //   this.elapsed,
    //   this.getTimeToCompletion()
    // );

    this.onTick();
  }

  protected abstract onTick(): void;
  abstract getTimeToCompletion(): Milliseconds;
  abstract isComplete(): boolean;
  /**Return branching actions and next step */
  protected abstract onComplete(): Error | ActionResolutionStepResult;

  /**Mark the gameUpdateCommand's completionOrderId and get branching actions and next step*/
  finalize(completionOrderId: number): Error | ActionResolutionStepResult {
    if (this.gameUpdateCommandOption)
      this.gameUpdateCommandOption.completionOrderId = completionOrderId;
    return this.onComplete();
  }

  getGameUpdateCommandOption(): null | GameUpdateCommand {
    return this.gameUpdateCommandOption;
  }
}
