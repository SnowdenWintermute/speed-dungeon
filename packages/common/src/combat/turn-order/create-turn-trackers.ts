import { CombatantTurnTracker } from ".";
import { BattleGroup } from "../../battle";
import { SpeedDungeonGame } from "../../game";

export default function createCombatTurnTrackers(
  game: SpeedDungeonGame,
  battleGroupA: BattleGroup,
  battleGroupB: BattleGroup
): Error | CombatantTurnTracker[] {
  const groupATrackersResult = createTrackersForBattleGroupCombatants(game, battleGroupA);
  if (groupATrackersResult instanceof Error) return groupATrackersResult;
  const groupBTrackersResult = createTrackersForBattleGroupCombatants(game, battleGroupB);
  if (groupBTrackersResult instanceof Error) return groupBTrackersResult;

  return groupATrackersResult.concat(groupBTrackersResult);
}

function createTrackersForBattleGroupCombatants(
  game: SpeedDungeonGame,
  battleGroup: BattleGroup
): Error | CombatantTurnTracker[] {
  const trackers: CombatantTurnTracker[] = [];
  for (const entityId of battleGroup.combatantIds) {
    const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
    if (combatantResult instanceof Error) return combatantResult;
    const combatant = combatantResult;
    if (combatant.combatantProperties.hitPoints > 0) {
      trackers.push(new CombatantTurnTracker(entityId));
    }
  }
  return trackers;
}
