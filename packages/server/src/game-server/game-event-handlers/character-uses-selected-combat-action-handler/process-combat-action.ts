import {
  ActionSequenceManagerRegistry,
  CombatActionExecutionIntent,
  CombatantContext,
  InputLock,
  NestedNodeReplayEvent,
  NestedNodeReplayEventUtls,
  ReplayEventType,
} from "@speed-dungeon/common";
import { ANIMATION_LENGTHS, idGenerator } from "../../../singletons/index.js";

export function processCombatAction(
  actionExecutionIntent: CombatActionExecutionIntent,
  combatantContext: CombatantContext
) {
  const registry = new ActionSequenceManagerRegistry(idGenerator, ANIMATION_LENGTHS);
  const rootReplayNode: NestedNodeReplayEvent = { type: ReplayEventType.NestedNode, events: [] };

  const initialGameUpdateOptionResult = registry.registerAction(
    actionExecutionIntent,
    rootReplayNode,
    combatantContext,
    null
  );

  if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;
  if (initialGameUpdateOptionResult)
    NestedNodeReplayEventUtls.appendGameUpdate(rootReplayNode, initialGameUpdateOptionResult);

  InputLock.lockInput(combatantContext.party.inputLock);

  while (registry.isNotEmpty()) {
    registry.processActiveActionSequences(combatantContext);
  }

  setTimeout(() => {
    InputLock.unlockInput(combatantContext.party.inputLock);
  }, registry.time.ms);

  const endedTurn = registry.getTurnEnded();

  return { rootReplayNode, endedTurn };
}
