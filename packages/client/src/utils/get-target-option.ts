import { useGameStore } from "@/stores/game-store";
import {
  CombatActionName,
  Combatant,
  CombatantContext,
  CombatantProperties,
  SpeedDungeonGame,
  TargetingCalculator,
} from "@speed-dungeon/common";

export function getTargetOption(
  gameOption: null | SpeedDungeonGame,
  user: Combatant,
  actionName: CombatActionName
) {
  const { combatActionTarget } = user.combatantProperties;
  if (!gameOption || !combatActionTarget) return undefined;
  const game = gameOption;
  const partyResult = useGameStore.getState().getParty();
  if (partyResult instanceof Error) return undefined;
  const battleOption = partyResult.battleId ? game.battles[partyResult.battleId]!! : null;

  const actionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
    user.combatantProperties,
    actionName
  );
  if (actionPropertiesResult instanceof Error) return actionPropertiesResult;
  const combatActionProperties = actionPropertiesResult;

  const targetingCalculator = new TargetingCalculator(
    new CombatantContext(game, partyResult, user),
    null
  );

  const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
    combatActionProperties,
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
