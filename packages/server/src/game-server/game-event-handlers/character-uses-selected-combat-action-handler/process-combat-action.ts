import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionSequenceManagerRegistry,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
  ERROR_MESSAGES,
  InputLock,
  LOOP_SAFETY_ITERATION_LIMIT,
  NestedNodeReplayEvent,
  NestedNodeReplayEventUtls,
  ReplayEventType,
} from "@speed-dungeon/common";
import { ANIMATION_LENGTHS, idGenerator } from "../../../singletons/index.js";
import { ActionUserContext } from "@speed-dungeon/common";

export function processCombatAction(
  actionExecutionIntent: CombatActionExecutionIntent,
  actionUserContext: ActionUserContext
) {
  const registry = new ActionSequenceManagerRegistry(idGenerator, ANIMATION_LENGTHS);
  const rootReplayNode: NestedNodeReplayEvent = { type: ReplayEventType.NestedNode, events: [] };

  const initialGameUpdateOptionResult = registry.registerAction(
    actionExecutionIntent,
    rootReplayNode,
    actionUserContext,
    null
  );

  if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;
  if (initialGameUpdateOptionResult)
    NestedNodeReplayEventUtls.appendGameUpdate(rootReplayNode, initialGameUpdateOptionResult);

  InputLock.lockInput(actionUserContext.party.inputLock);

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
    InputLock.unlockInput(actionUserContext.party.inputLock);
  }, registry.time.ms);

  const endedTurn = registry.getTurnEnded();

  return { rootReplayNode, endedTurn };
}
