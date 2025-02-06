import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { EvalOnHitOutcomeTriggersActionResolutionStep } from "./evaluate-hit-outcome-triggers.js";
import { HpChange } from "../../combat/hp-change-source-types.js";
import { DurabilityChangesByEntityId } from "../../combat/action-results/calculate-action-durability-changes.js";
import { EntityId } from "../../primatives/index.js";

export interface HitOutcomes {
  hitPointChanges: { [entityId: EntityId]: HpChange };
  manaChanges: { [entityId: EntityId]: number };
  evasions: EntityId[];
  parries: EntityId[];
  blocks: EntityId[];
  durabilityChanges: DurabilityChangesByEntityId;
}

export class RollIncomingHitOutcomesActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    // @TODO - calculate hits, evades, parries, blocks, hp/mp/shard/durability changes to apply
    // and pass them to the next step for triggers and filtering
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.HitOutcomes,
      completionOrderId: null,
      actionName: context.actionExecutionIntent.actionName,
      // hits, misses, evades, parries, blocks
    };
    super(ActionResolutionStepType.payResourceCosts, context, gameUpdateCommand);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new EvalOnHitOutcomeTriggersActionResolutionStep(this.context, []), // send hits here
    };
  }
}
