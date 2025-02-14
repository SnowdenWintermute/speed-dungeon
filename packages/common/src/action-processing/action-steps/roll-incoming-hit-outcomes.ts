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
import { CombatActionExecutionIntent } from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";

export interface HitOutcomes {
  hitPointChanges: { [entityId: EntityId]: HpChange };
  manaChanges: { [entityId: EntityId]: number };
  evasions: EntityId[];
  parries: EntityId[];
  blocks: EntityId[];
  durabilityChanges: DurabilityChangesByEntityId;
}

const stepType = ActionResolutionStepType.rollIncomingHitOutcomes;
export class RollIncomingHitOutcomesActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    // @TODO - calculate hits, evades, parries, blocks, hp/mp/shard/durability changes to apply
    // and write them to the billboard so post-activation triggers can read them
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.HitOutcomes,
      step: stepType,
      completionOrderId: null,
      actionName: context.actionExecutionIntent.actionName,
      // hits, misses, evades, parries, blocks
    };
    super(stepType, context, gameUpdateCommand);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    return [];
  }
}
