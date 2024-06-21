import {
  ActionResult,
  Battle,
  CombatTurnResult,
  CombatantAbility,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { AISelectActionAndTarget } from "@speed-dungeon/common";

export default function takeAiControlledTurnsIfAppropriate(
  game: SpeedDungeonGame,
  battle: Battle
): Error | CombatTurnResult[] {
  const turnResults: CombatTurnResult[] = [];
  const { turnTrackers } = battle;
  const activeCombatantTrackerOption = turnTrackers[0];
  if (!activeCombatantTrackerOption) return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);

  let activeCombatantId = activeCombatantTrackerOption.entityId;
  let activeCombatantResult = SpeedDungeonGame.getCombatantById(game, activeCombatantId);
  if (activeCombatantResult instanceof Error) return activeCombatantResult;
  let { entityProperties, combatantProperties } = activeCombatantResult;
  let activeCombatantIsAiControlled = combatantProperties.controllingPlayer === null;
  let activeCombatantTurnActionResults: ActionResult[] = [];

  while (activeCombatantIsAiControlled) {
    const battleGroupResult = Battle.getAllyAndEnemyBattleGroups(battle, activeCombatantId);
    if (battleGroupResult instanceof Error) return battleGroupResult;
    const { allyGroup, enemyGroup } = battleGroupResult;
    const allyIds = allyGroup.combatantIds;
    const abilityAndTargetResult = AISelectActionAndTarget(
      game,
      activeCombatantId,
      allyGroup,
      enemyGroup
    );
    if (abilityAndTargetResult instanceof Error) return abilityAndTargetResult;
    const { abilityName, target } = abilityAndTargetResult;

    const actionResultsResult = SpeedDungeonGame.getAbilityActionResults(
      game,
      entityProperties.id,
      abilityName,
      target,
      battle,
      allyIds
    );
    if (actionResultsResult instanceof Error) return actionResultsResult;
    const actionResults = actionResultsResult;

    SpeedDungeonGame.applyActionResults(game, actionResults, battle.id);

    activeCombatantTurnActionResults.push(...actionResults);

    const abilityAttributes = CombatantAbility.getAttributes(abilityName);

    if (!abilityAttributes.combatActionProperties.requiresCombatTurn) continue;

    turnResults.push({
      combatantId: activeCombatantId,
      actionResults: activeCombatantTurnActionResults,
    });

    const playerPartyDefeatedResult = SpeedDungeonGame.allCombatantsInGroupAreDead(
      game,
      enemyGroup.combatantIds
    );
    if (playerPartyDefeatedResult instanceof Error) return playerPartyDefeatedResult;
    if (playerPartyDefeatedResult) break;

    activeCombatantTurnActionResults = [];
    const newActiveTurnTrackerResult = SpeedDungeonGame.endActiveCombatantTurn(game, battle);
    if (newActiveTurnTrackerResult instanceof Error) return newActiveTurnTrackerResult;
    activeCombatantId = newActiveTurnTrackerResult.entityId;
    const activeCombatantResult = SpeedDungeonGame.getCombatantById(game, activeCombatantId);
    if (activeCombatantResult instanceof Error) return activeCombatantResult;
    ({ entityProperties, combatantProperties } = activeCombatantResult);
    activeCombatantIsAiControlled = combatantProperties.controllingPlayer !== null;
  }

  return turnResults;
}
