import { ActionUserContext } from "../action-user-context/index.js";
import { LOOP_SAFETY_ITERATION_LIMIT } from "../app-consts.js";
import { CombatActionExecutionIntent } from "../combat/combat-actions/combat-action-execution-intent.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { AnimationLengths, BoundingBoxSizes } from "../types.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerationPolicy } from "../utility-classes/random-number-generation-policy.js";
import { ActionSequenceManagerRegistry } from "./action-sequence-manager-registry.js";
import { LootGenerator } from "../items/item-creation/loot-generator.js";
import {
  NestedNodeReplayEvent,
  NestedNodeReplayEventUtls,
  ReplayEventType,
} from "./replay-events.js";

export function processCombatAction(
  actionExecutionIntent: CombatActionExecutionIntent,
  actionUserContext: ActionUserContext,
  idGenerator: IdGenerator,
  rngPolicy: RandomNumberGenerationPolicy,
  animationLengths: AnimationLengths,
  boundingBoxSizes: BoundingBoxSizes,
  lootGenerator: LootGenerator
) {
  const registry = new ActionSequenceManagerRegistry(
    idGenerator,
    rngPolicy,
    animationLengths,
    boundingBoxSizes,
    lootGenerator
  );

  const rootReplayNode: NestedNodeReplayEvent = { type: ReplayEventType.NestedNode, events: [] };

  const initialGameUpdateOption = registry.registerAction(
    actionExecutionIntent,
    rootReplayNode,
    actionUserContext,
    null
  );

  if (initialGameUpdateOption) {
    NestedNodeReplayEventUtls.appendGameUpdate(rootReplayNode, initialGameUpdateOption);
  }

  actionUserContext.party.inputLock.lockInput();

  let safetyCounter = -1;
  while (registry.isNotEmpty()) {
    safetyCounter += 1;

    if (safetyCounter > LOOP_SAFETY_ITERATION_LIMIT) {
      console.error(
        ERROR_MESSAGES.LOOP_SAFETY_ITERATION_LIMIT_REACHED(LOOP_SAFETY_ITERATION_LIMIT),
        "in process-combat-action"
      );
      break;
    }
    registry.processActiveActionSequences(actionUserContext);
  }

  setTimeout(() => {
    actionUserContext.party.inputLock.unlockInput();
  }, registry.time.ms);

  const endedTurn = registry.getTurnEnded();

  return { rootReplayNode, endedTurn, battleConcludedOption: registry.battleConcludedOption };
}
