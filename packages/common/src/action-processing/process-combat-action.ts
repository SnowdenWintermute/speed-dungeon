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
import { AdventuringParty } from "../adventuring-party/index.js";
import { CombatantId } from "../aliases.js";
import { SpeedDungeonGame } from "../game/index.js";
import { COMBAT_ACTION_NAME_STRINGS } from "../combat/combat-actions/combat-action-names.js";

export function processCombatAction(
  actionExecutionIntent: CombatActionExecutionIntent,
  actionUserContext: ActionUserContext,
  idGenerator: IdGenerator,
  rngPolicy: RandomNumberGenerationPolicy,
  animationLengths: AnimationLengths,
  boundingBoxSizes: BoundingBoxSizes,
  lootGenerator: LootGenerator
) {
  const { party, game } = actionUserContext;
  const wasInBattle = party.battleId !== null;
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

  const battleJustEnded = wasInBattle && party.battleId === null;
  const removedCombatantIds = postActionProcessedCleanup(game, party, battleJustEnded);

  return {
    rootReplayNode,
    removedCombatantIds,
    endedTurn,
    battleConcludedOption: registry.battleConcludedOption,
  };
}

// try clean up after replay tree. need to remove combatants after all actions resolved, including those
// which would be triggered by removal of conditions on neutral combatant death, like web removed
// at end of battle triggering flying condition, but the web had an ice burst that needed to go off on it
// so we couldn't remove the web yet, just act like it would be removed and trigger conditions as such
export function postActionProcessedCleanup(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  battleJustEnded: boolean
) {
  const removedCombatantIds: CombatantId[] = [];
  if (battleJustEnded) {
    removedCombatantIds.push(...party.removeCombatantsOnBattleEnd(game));
  }

  for (const [entityId, combatant] of party.combatantManager.getAllCombatants()) {
    if (!combatant.getCombatantProperties().isDead()) {
      continue;
    }
    const shouldRemove = combatant.getCombatantProperties().removeFromPartyOnDeath;
    if (shouldRemove) {
      party.combatantManager.removeCombatant(entityId as CombatantId, game);
      removedCombatantIds.push(entityId as CombatantId);
    }
  }

  return removedCombatantIds;
}
