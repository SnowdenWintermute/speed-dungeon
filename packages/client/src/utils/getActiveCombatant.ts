import { GameState } from "@/stores/game-store";
import getCurrentBattleOption from "./getCurrentBattleOption";
import getGameAndParty from "./getGameAndParty";
import { Battle, ERROR_MESSAGES } from "@speed-dungeon/common";

export default function getActiveCombatant(gameState: GameState) {
  const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
  if (gameAndPartyResult instanceof Error) return gameAndPartyResult;
  const [game, party] = gameAndPartyResult;
  const battleOption = getCurrentBattleOption(game, party.name);
  if (!battleOption) return null;
  const battle = battleOption;

  const activeCombatantTurnTrackerOption = battle.turnTrackers[0];
  if (!activeCombatantTurnTrackerOption)
    return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);

  const allyAndEnemyBattleGroupsResult = Battle.getAllyAndEnemyBattleGroups(
    battle,
    activeCombatantTurnTrackerOption.entityId
  );
  if (allyAndEnemyBattleGroupsResult instanceof Error) return allyAndEnemyBattleGroupsResult;

  //
}
