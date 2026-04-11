import { Milliseconds } from "../../aliases.js";
import { GameUpdateCommand } from "../game-update-commands.js";
import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";
import { ActionSequenceManager } from "../action-sequence-manager.js";
import { ActionTracker } from "../action-tracker.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { RandomNumberGenerationPolicy } from "../../utility-classes/random-number-generation-policy.js";
import { IActionUser } from "../../action-user-context/action-user.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { COMBAT_ACTION_NAME_STRINGS } from "../../combat/combat-actions/combat-action-names.js";

export enum ActionResolutionStepType {
  PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock,
  PreInitialPositioningCheckEnvironmentalHazardTriggers,
  InitialPositioning,
  WaitForInitialDelay,
  PostInitialPositioningDetermineShouldExecuteOrReleaseTurnLock,
  DetermineMeleeActionAnimations,
  PrepMotion,
  PostPrepSpawnEntity,
  ChamberingMotion,
  DeliveryMotion,
  PayResourceCosts,
  PostActionUseGameLogMessage,
  EvalOnUseTriggers,
  OnActivationSpawnEntity,
  StartConcurrentSubActions, // starts actions that happen simultaneously and independently such as ["arrow projectile"]
  PreActionEntityMotionCheckEnvironmentalHazardTriggers,
  OnActivationActionEntityMotion,
  RollIncomingHitOutcomes,
  EvalOnHitOutcomeTriggers, // may start branching actions if triggered
  PostOnResolutionGameLogMessage,
  DetermineChildActions, // enqueues sequential actions such as [ "main hand attack", "off hand attack" ]
  // FINAL STEPS - conditionally obtained. example - may skip PreInitialPositioningCheckEnvironmentalHazardTriggers
  // and FinalPositioning and just do RecoveryMotion
  // if doing offhand attack instead of return home directly after mainhand attack
  PreFinalPositioningCheckEnvironmentalHazardTriggers,
  RemoveTickedConditionStacks,
  BattleResolution, // on party wipe: generate loot/xp, cleanup, emit conclusion
  EvaluatePlayerEndTurnAndInputLock,
  ActionEntityDissipationMotion,
  RecoveryMotion,
  FinalPositioning,
}

export const ACTION_RESOLUTION_STEP_TYPE_STRINGS: Record<ActionResolutionStepType, string> = {
  [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]:
    "preInitialPositioningDetermineShouldExecuteOrReleaseTurnLock",
  [ActionResolutionStepType.DetermineChildActions]: "determineChildActions",
  [ActionResolutionStepType.DetermineMeleeActionAnimations]: "determineMeleeActionAnimations",
  [ActionResolutionStepType.InitialPositioning]: "initialPositioning",
  [ActionResolutionStepType.WaitForInitialDelay]: "waitForInitialDelay",
  [ActionResolutionStepType.PostInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]:
    "postInitialPositioningDetermineShouldExecuteOrReleaseTurnLock",
  [ActionResolutionStepType.PrepMotion]: "chamberingMotion",
  [ActionResolutionStepType.PostPrepSpawnEntity]: "postPrepSpawnEntity",
  [ActionResolutionStepType.ChamberingMotion]: "chamberingMotion",
  [ActionResolutionStepType.EvalOnUseTriggers]: "evalOnUseTriggers", // counterspells, branch block/parry/counterattacks, bow durability loss
  [ActionResolutionStepType.DeliveryMotion]: "deliveryMotion",
  [ActionResolutionStepType.PayResourceCosts]: "payResourceCosts",
  [ActionResolutionStepType.PostActionUseGameLogMessage]: "postActionUseGameLogMessage",
  [ActionResolutionStepType.StartConcurrentSubActions]: "StartConcurrentSubActions",
  [ActionResolutionStepType.OnActivationSpawnEntity]: "onActivationSpawnEntity",
  [ActionResolutionStepType.PreActionEntityMotionCheckEnvironmentalHazardTriggers]:
    "preActionEntityMotionCheckEnvironmentalHazardTriggers",
  [ActionResolutionStepType.OnActivationActionEntityMotion]: "onActivationActionEntityMotion",
  [ActionResolutionStepType.RollIncomingHitOutcomes]: "rollIncomingHitOutcomes",
  [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: "evalOnHitOutcomeTriggers", // lifesteal traits, apply conditions
  [ActionResolutionStepType.PostOnResolutionGameLogMessage]: "postOnResolutionGameLogMessage",
  [ActionResolutionStepType.ActionEntityDissipationMotion]: "actionEntityDissipationMotion",
  [ActionResolutionStepType.RecoveryMotion]: "recoveryMotion",
  [ActionResolutionStepType.FinalPositioning]: "finalPositioning",
  [ActionResolutionStepType.PreInitialPositioningCheckEnvironmentalHazardTriggers]:
    "preInitialPositioningCheckEnvironmentalHazardTriggers",
  [ActionResolutionStepType.PreFinalPositioningCheckEnvironmentalHazardTriggers]:
    "preFinalPositioningCheckEnvironmentalHazardTriggers",
  [ActionResolutionStepType.RemoveTickedConditionStacks]: "removeTickedConditionStacks",
  [ActionResolutionStepType.BattleResolution]: "battleResolution",
  [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: "evaluatePlayerEndTurnAndInputLock",
};

export interface ActionResolutionStepResult {
  branchingActions: ActionIntentAndUser[];
  nextStepOption: ActionResolutionStep | null;
}

export interface ActionResolutionStepContext {
  actionUserContext: ActionUserContext;
  tracker: ActionTracker;
  manager: ActionSequenceManager;
  idGenerator: IdGenerator;
  rngPolicy: RandomNumberGenerationPolicy;
}

export interface ActionIntentAndUser {
  user: IActionUser;
  actionExecutionIntent: CombatActionExecutionIntent;
}

export interface ActionIntentOptionAndUser {
  user: IActionUser;
  actionExecutionIntent: null | CombatActionExecutionIntent;
}

export abstract class ActionResolutionStep {
  protected elapsed: Milliseconds = 0;
  constructor(
    public readonly type: ActionResolutionStepType,
    protected context: ActionResolutionStepContext,
    protected gameUpdateCommandOption: null | GameUpdateCommand
  ) {
    const action = COMBAT_ACTIONS[this.context.tracker.actionExecutionIntent.actionName];
    const stepConfig = action.stepsConfig.getStepConfigOption(type);

    if (stepConfig === undefined) throw new Error("expected step config not found");
    if (gameUpdateCommandOption && stepConfig.getCosmeticEffectsToStop) {
      gameUpdateCommandOption.cosmeticEffectsToStop = stepConfig.getCosmeticEffectsToStop(context);
    }
    if (gameUpdateCommandOption && stepConfig.getCosmeticEffectsToStart) {
      gameUpdateCommandOption.cosmeticEffectsToStart =
        stepConfig.getCosmeticEffectsToStart(context);
    }
  }

  getStringName() {
    return ACTION_RESOLUTION_STEP_TYPE_STRINGS[this.type];
  }

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
  protected abstract getBranchingActions(): Error | ActionIntentAndUser[];

  /**Mark the gameUpdateCommand's completionOrderId and get branching actions*/
  finalize(completionOrderId: number): Error | ActionIntentAndUser[] {
    if (this.gameUpdateCommandOption) {
      this.gameUpdateCommandOption.completionOrderId = completionOrderId;
    }
    return this.onComplete();
  }

  getGameUpdateCommandOption(): null | GameUpdateCommand {
    return this.gameUpdateCommandOption;
  }

  onComplete(): Error | ActionIntentAndUser[] {
    // console.log(
    //   "completed step:",
    //   COMBAT_ACTION_NAME_STRINGS[this.context.tracker.actionExecutionIntent.actionName],
    //   this.getStringName()
    // );
    const branchingActionsResult = this.getBranchingActions();
    if (branchingActionsResult instanceof Error) return branchingActionsResult;
    return branchingActionsResult;
  }
}
