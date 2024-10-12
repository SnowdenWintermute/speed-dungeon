import { GameState } from "@/stores/game-store";
import getCurrentBattleOption from "./getCurrentBattleOption";
import getGameAndParty from "./getGameAndParty";
import { Combatant, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";

export default function getActiveCombatant(gameState: GameState): Error | null | Combatant {
  const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
  if (gameAndPartyResult instanceof Error) return gameAndPartyResult;
  const [game, party] = gameAndPartyResult;
  const battleOptionResult = getCurrentBattleOption(game, party.name);
  if (battleOptionResult instanceof Error) return battleOptionResult;
  const battleOption = battleOptionResult;
  if (battleOption === null) return null;
  const battle = battleOption;

  const activeCombatantTurnTrackerOption = battle.turnTrackers[0];
  if (!activeCombatantTurnTrackerOption)
    return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);

  const combatantResult = SpeedDungeonGame.getCombatantById(
    game,
    activeCombatantTurnTrackerOption.entityId
  );
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties, entityProperties } = combatantResult;
  return { combatantProperties, entityProperties };
}
