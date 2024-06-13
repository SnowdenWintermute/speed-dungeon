import { Battle, CombatTurnResult, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import getAllyAndEnemyBattleGroups from "@speed-dungeon/common/src/battle/get-ally-and-enemy-battle-groups";
import AISelectActionAndTarget from "@speed-dungeon/common/src/combat/ai-behavior/ai-select_action_and_target";

export default function takeAiControlledTurnsIfAppropriate(game: SpeedDungeonGame, battle: Battle) {
  const turnResults: CombatTurnResult[] = [];
  const { turnTrackers } = battle;
  const activeCombatantTrackerOption = turnTrackers[0];
  if (!activeCombatantTrackerOption) return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);

  let activeCombatantId = activeCombatantTrackerOption.entityId;
  let activeCombatantResult = SpeedDungeonGame.getCombatantById(game, activeCombatantId);
  if (activeCombatantResult instanceof Error) return activeCombatantResult;
  let { entityProperties, combatantProperties } = activeCombatantResult;
  let activeCombatantIsAiControlled = combatantProperties.controllingPlayer === null;
  const activeCombatantTurnActionResults = [];

  while (activeCombatantIsAiControlled) {
    const battleGroupResult = Battle.getAllyAndEnemyBattleGroups(battle, activeCombatantId);
    if (battleGroupResult instanceof Error) return battleGroupResult;
    const { allyGroup, enemyGroup } = battleGroupResult;
    const allyIds = allyGroup.combatantIds;
    const enemyIds = enemyGroup.combatantIds;
    const abilityAndTargetResult = AISelectActionAndTarget(
      game,
      activeCombatantId,
      allyGroup,
      enemyGroup
    );
    if (abilityAndTargetResult instanceof Error) return abilityAndTargetResult;
    const { abilityName, target } = abilityAndTargetResult;
    //
  }
}
