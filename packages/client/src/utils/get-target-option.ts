import { useGameStore } from "@/stores/game-store";
import {
  ActionUserContext,
  COMBAT_ACTIONS,
  CombatActionName,
  Combatant,
  SpeedDungeonGame,
  TargetingCalculator,
} from "@speed-dungeon/common";

export function getTargetOption(
  gameOption: null | SpeedDungeonGame,
  user: Combatant,
  actionName: CombatActionName
) {
  const targetingProperties = user.getTargetingProperties();
  const combatActionTarget = targetingProperties.getSelectedTarget();
  const actionRank = targetingProperties.getSelectedActionAndRank()?.rank;

  if (!gameOption || combatActionTarget === null || actionRank === undefined) return undefined;
  const game = gameOption;
  const partyResult = useGameStore.getState().getParty();
  if (partyResult instanceof Error) return undefined;

  const actionPropertiesResult = COMBAT_ACTIONS[actionName];
  if (actionPropertiesResult instanceof Error) return actionPropertiesResult;
  const combatActionProperties = actionPropertiesResult;

  const targetingCalculator = new TargetingCalculator(
    new ActionUserContext(game, partyResult, user),
    null
  );

  const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
    combatActionProperties,
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
