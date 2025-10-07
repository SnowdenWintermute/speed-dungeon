import { GameState } from "@/stores/game-store";
import getCurrentBattleOption from "./getCurrentBattleOption";
import getGameAndParty from "./getGameAndParty";
import { Combatant, CombatantTurnTracker, ERROR_MESSAGES } from "@speed-dungeon/common";

export function getActiveCombatant(gameState: GameState): Error | null | Combatant {
  const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
  if (gameAndPartyResult instanceof Error) return gameAndPartyResult;
  const [game, party] = gameAndPartyResult;
  const battleOptionResult = getCurrentBattleOption(game, party.name);
  if (battleOptionResult instanceof Error) return battleOptionResult;
  const battleOption = battleOptionResult;
  if (battleOption === null) return null;
  const battle = battleOption;

  const fastestTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();
  if (!(fastestTracker instanceof CombatantTurnTracker)) return null;
  const combatantOption = party.combatantManager.getCombatantOption(
    fastestTracker.getTaggedIdOfTrackedEntity().combatantId
  );
  if (combatantOption === undefined) return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);

  return combatantOption;
}
