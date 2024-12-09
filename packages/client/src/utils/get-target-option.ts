import { useGameStore } from "@/stores/game-store";
import {
  Battle,
  CombatAction,
  Combatant,
  CombatantProperties,
  SpeedDungeonGame,
  getCombatActionTargetIds,
} from "@speed-dungeon/common";

export function getTargetOption(
  gameOption: null | SpeedDungeonGame,
  user: Combatant,
  combatAction: CombatAction
) {
  const { combatActionTarget } = user.combatantProperties;
  const userId = user.entityProperties.id;
  if (!gameOption || !combatActionTarget) return undefined;
  const game = gameOption;
  const partyResult = useGameStore.getState().getParty();
  if (partyResult instanceof Error) return undefined;
  const battleOption = partyResult.battleId ? game.battles[partyResult.battleId]!! : null;

  const allyIds = (() => {
    if (battleOption) {
      const result = Battle.getAllyIdsAndOpponentIdsOption(battleOption, userId);
      if (result instanceof Error) return partyResult.characterPositions;
      return result.allyIds;
    }
    return partyResult.characterPositions;
  })();

  const actionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
    user.combatantProperties,
    combatAction
  );
  if (actionPropertiesResult instanceof Error) return actionPropertiesResult;
  const combatActionProperties = actionPropertiesResult;

  const targetIdsResult = getCombatActionTargetIds(
    partyResult,
    combatActionProperties,
    userId,
    allyIds,
    battleOption,
    combatActionTarget
  );
  if (targetIdsResult instanceof Error) return undefined;
  const targetIds = targetIdsResult;
  const firstTargetIdOption = targetIds[0];
  if (firstTargetIdOption === undefined) return undefined;
  const firstTargetCombatant = SpeedDungeonGame.getCombatantById(game, firstTargetIdOption);
  if (firstTargetCombatant instanceof Error) return undefined;
  return firstTargetCombatant.combatantProperties;
}
