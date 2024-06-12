import { Battle, BattleGroup } from ".";
import createCombatTurnTrackers from "../combat/turn-order/create-turn-trackers";
import { SpeedDungeonGame } from "../game";

export function initateBattle(
  game: SpeedDungeonGame,
  groupA: BattleGroup,
  groupB: BattleGroup
): Error | string {
  const turnTrackersResult = createCombatTurnTrackers(game, groupA, groupB);
  if (turnTrackersResult instanceof Error) return turnTrackersResult;
  const battle = new Battle(game.idGenerator.getNextEntityId(), groupA, groupB, turnTrackersResult);
  game.battles[battle.id] = battle;
  return battle.id;
}
