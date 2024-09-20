import { Battle } from "../../battle/index.js";
import { CombatantProperties } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { filterPossibleTargetIdsByProhibitedCombatantStates } from "../targeting/filtering.js";
import getActionTargetsIfSchemeIsValid from "../targeting/get-targets-if-scheme-is-valid.js";
import { ActionResultCalculationArguments } from "./action-result-calculator.js";

export default function getCombatActionTargetIds(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments
): Error | string[] {
  const { battleOption, userId, combatAction, targets } = args;
  let allyIds = args.allyIds;
  let opponentIdsOption: null | string[] = null;
  if (battleOption !== null) {
    const allyIdsAndOpponentIdsOptionResult = Battle.getAllyIdsAndOpponentIdsOption(
      battleOption,
      userId
    );
    if (allyIdsAndOpponentIdsOptionResult instanceof Error)
      return allyIdsAndOpponentIdsOptionResult;
    opponentIdsOption = allyIdsAndOpponentIdsOptionResult.opponentIdsOption;
  }
  const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties } = combatantResult;
  const actionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
    combatantProperties,
    combatAction
  );
  if (actionPropertiesResult instanceof Error) return actionPropertiesResult;

  const partyResult = SpeedDungeonGame.getPartyOfCombatant(game, userId);
  if (partyResult instanceof Error) return partyResult;
  const party = partyResult;

  const filteredTargetsResult = filterPossibleTargetIdsByProhibitedCombatantStates(
    party,
    actionPropertiesResult.prohibitedTargetCombatantStates,
    allyIds,
    opponentIdsOption
  );

  if (filteredTargetsResult instanceof Error) return filteredTargetsResult;
  const [filteredAllyIds, filteredOpponentIdsOption] = filteredTargetsResult;

  const targetEntityIdsResult = getActionTargetsIfSchemeIsValid(
    targets,
    filteredAllyIds,
    filteredOpponentIdsOption,
    []
  );

  return targetEntityIdsResult;
}
