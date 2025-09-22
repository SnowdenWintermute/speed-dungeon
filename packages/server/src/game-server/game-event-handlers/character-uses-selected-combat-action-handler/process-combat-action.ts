import {
  ActionSequenceManagerRegistry,
  CombatActionExecutionIntent,
  InputLock,
  NestedNodeReplayEvent,
  NestedNodeReplayEventUtls,
  ReplayEventType,
} from "@speed-dungeon/common";
import { ANIMATION_LENGTHS, idGenerator } from "../../../singletons/index.js";
import { ActionUserContext } from "@speed-dungeon/common/src/combatant-context/action-user.js";

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

  while (registry.isNotEmpty()) {
    registry.processActiveActionSequences(actionUserContext);
  }

  setTimeout(() => {
    InputLock.unlockInput(actionUserContext.party.inputLock);
  }, registry.time.ms);

  const endedTurn = registry.getTurnEnded();

  return { rootReplayNode, endedTurn };
}
