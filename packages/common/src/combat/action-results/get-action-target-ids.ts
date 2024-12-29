import { AdventuringParty } from "../../adventuring-party/index.js";
import { Battle } from "../../battle/index.js";
import { CombatActionProperties } from "../combat-actions/combat-action-properties.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import { filterPossibleTargetIdsByProhibitedCombatantStates } from "../targeting/filtering.js";
import getActionTargetsIfSchemeIsValid from "../targeting/get-targets-if-scheme-is-valid.js";

export function getCombatActionTargetIds(
  party: AdventuringParty,
  combatActionProperties: CombatActionProperties,
  userId: string,
  allyIds: string[],
  battleOption: null | Battle,
  targets: CombatActionTarget
): Error | string[] {
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

  const filteredTargetsResult = filterPossibleTargetIdsByProhibitedCombatantStates(
    party,
    combatActionProperties.prohibitedTargetCombatantStates,
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
