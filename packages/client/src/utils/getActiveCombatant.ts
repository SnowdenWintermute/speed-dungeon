import { GameState } from "@/stores/game-store";
import getCurrentBattleOption from "./getCurrentBattleOption";
import getGameAndParty from "./getGameAndParty";
import {
  AdventuringParty,
  Combatant,
  CombatantTurnTracker,
  ConditionTurnTracker,
} from "@speed-dungeon/common";

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
  return AdventuringParty.getCombatant(
    party,
    fastestTracker.getTaggedIdOfTrackedEntity().combatantId
  );
}
