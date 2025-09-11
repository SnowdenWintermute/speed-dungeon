import { Milliseconds } from "../../primatives/index.js";
import { Combatant } from "../../combatants/index.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  CombatActionComponent,
} from "../../combat/index.js";
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

export enum ActionResolutionStepType {
  PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock,
  PreInitialPositioningCheckEnvironmentalHazardTriggers,
  InitialPositioning,
  PostInitialPositioningDetermineShouldExecuteOrReleaseTurnLock,
  DetermineMeleeActionAnimations,
  PrepMotion,
  PostPrepSpawnEntity,
  ChamberingMotion,
  DeliveryMotion,
  PayResourceCosts,
  PostActionUseCombatLogMessage,
  EvalOnUseTriggers,
  StartConcurrentSubActions, // starts actions that happen simultaneously and independently such as ["arrow projectile"]
  OnActivationSpawnEntity,
  OnActivationActionEntityMotion,
  RollIncomingHitOutcomes,
  EvalOnHitOutcomeTriggers, // may start branching actions if triggered
  DetermineChildActions, // enqueues sequential actions such as [ "main hand attack", "off hand attack" ]
  // FINAL STEPS - conditionally obtained. example - may skip PreInitialPositioningCheckEnvironmentalHazardTriggers
  // and FinalPositioning and just do RecoveryMotion
  // if doing offhand attack instead of return home directly after mainhand attack
  PreFinalPositioningCheckEnvironmentalHazardTriggers,
  EvaluatePlayerEndTurnAndInputLock,
  RemoveTickedConditionStacks,
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
  [ActionResolutionStepType.PostInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]:
    "postInitialPositioningDetermineShouldExecuteOrReleaseTurnLock",
  [ActionResolutionStepType.PrepMotion]: "chamberingMotion",
  [ActionResolutionStepType.PostPrepSpawnEntity]: "postPrepSpawnEntity",
  [ActionResolutionStepType.ChamberingMotion]: "chamberingMotion",
  [ActionResolutionStepType.EvalOnUseTriggers]: "evalOnUseTriggers", // counterspells, branch block/parry/counterattacks, bow durability loss
  [ActionResolutionStepType.DeliveryMotion]: "deliveryMotion",
  [ActionResolutionStepType.PayResourceCosts]: "payResourceCosts",
  [ActionResolutionStepType.PostActionUseCombatLogMessage]: "postActionUseCombatLogMessage",
  [ActionResolutionStepType.StartConcurrentSubActions]: "StartConcurrentSubActions",
  [ActionResolutionStepType.OnActivationSpawnEntity]: "onActivationSpawnEntity",
  [ActionResolutionStepType.OnActivationActionEntityMotion]: "onActivationActionEntityMotion",
  [ActionResolutionStepType.RollIncomingHitOutcomes]: "rollIncomingHitOutcomes",
  [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: "evalOnHitOutcomeTriggers", // lifesteal traits, apply conditions
  [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: "EvaluatePlayerEndTurnAndInputLock",
  [ActionResolutionStepType.ActionEntityDissipationMotion]: "actionEntityDissipationMotion",
  [ActionResolutionStepType.RecoveryMotion]: "recoveryMotion",
  [ActionResolutionStepType.FinalPositioning]: "finalPositioning",
  [ActionResolutionStepType.PreInitialPositioningCheckEnvironmentalHazardTriggers]:
    "preInitialPositioningCheckEnvironmentalHazardTriggers",
  [ActionResolutionStepType.PreFinalPositioningCheckEnvironmentalHazardTriggers]:
    "preFinalPositioningCheckEnvironmentalHazardTriggers",
  [ActionResolutionStepType.RemoveTickedConditionStacks]: "removeTickedConditionStacks",
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
  ) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    console.log(
      COMBAT_ACTION_NAME_STRINGS[action.name],
      ACTION_RESOLUTION_STEP_TYPE_STRINGS[this.type]
    );

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
