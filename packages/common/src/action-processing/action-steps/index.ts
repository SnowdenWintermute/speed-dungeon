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

// MAIN BRANCH - ranged attack
// - move user into position
// - spawn arrow vfx attached to combatant hand
// - start user use animation
// - pay costs
// - check on use triggers
// - BRANCH - arrow fired
//   - move knocked arrow vfx toward target
//   - roll hit outcomes
//   - check hit triggers
//   BRANCH
//     - animate target  hit recovery, block or parry
// - start user post use animation
// - start user move home
// - end turn
//
// MAIN BRANCH - firebolt
// - move user into position
// - spawn fire spellcast chargeup effect vfx attached to combatant weapon or hand
// - BRANCH
//   - start animating fire spellcast effect
// - start user animation
// - pay costs
// - check on use triggers
// - BRANCH
//   - IF COUNTERED
//     - spawn spellcast countered effect
//     - start animating spellcast countered effect
//   - IF SUCCESS
//     - spawn firebolt vfx
//     - start animating/translating firebolt vfx toward target
//     - roll hit outcomes
//     - check triggers
//     BRANCH
//       - animate target hit recovery or parry
//     - animate firebolt explosion or dissipation
// - start user post use animation
// - start user move home
// - end turn

export enum ActionResolutionStepType {
  determineChildActions,
  preUsePositioning,
  startUseAnimation,
  payResourceCosts,
  evalOnUseTriggers,
  rollIncomingHitOutcomes,
  evalOnHitOutcomeTriggers,
  postUseAnimation,
  postUsePositioning,
  spawnVfx,
  vfxMotion,
}

export const ACTION_RESOLUTION_STEP_TYPE_STRINGS: Record<ActionResolutionStepType, string> = {
  [ActionResolutionStepType.determineChildActions]: "determineChildActions",
  [ActionResolutionStepType.preUsePositioning]: "preUsePositioning",
  [ActionResolutionStepType.startUseAnimation]: "startUseAnimation",
  [ActionResolutionStepType.payResourceCosts]: "payResourceCosts",
  [ActionResolutionStepType.evalOnUseTriggers]: "evalOnUseTriggers",
  [ActionResolutionStepType.rollIncomingHitOutcomes]: "rollIncomingHitOutcomes",
  [ActionResolutionStepType.evalOnHitOutcomeTriggers]: "evalOnHitOutcomeTriggers",
  [ActionResolutionStepType.postUseAnimation]: "postUseAnimation",
  [ActionResolutionStepType.postUsePositioning]: "postUsePositioning",
  [ActionResolutionStepType.spawnVfx]: "spawn vfx",
  [ActionResolutionStepType.vfxMotion]: "vfx motion",
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
