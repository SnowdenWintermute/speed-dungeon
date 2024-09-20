import { AdventuringParty } from "../../adventuring_party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { CombatActionProperties } from "../combat-actions/index.js";
import {
  filterPossibleTargetIdsByActionTargetCategories,
  filterPossibleTargetIdsByProhibitedCombatantStates,
} from "./filtering.js";

export default function getFilteredPotentialTargetIds(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  characterId: string,
  combatActionProperties: CombatActionProperties
): Error | [null | string[], null | string[]] {
  const allyAndOpponetIdsResult = SpeedDungeonGame.getAllyIdsAndOpponentIdsOption(
    game,
    party,
    characterId
  );
  if (allyAndOpponetIdsResult instanceof Error) return allyAndOpponetIdsResult;
  let allyIdsOption: null | string[] = allyAndOpponetIdsResult.allyIds;
  let opponentIdsOption: null | string[] = allyAndOpponetIdsResult.opponentIdsOption;

  const prohibitedTargetCombatantStates = combatActionProperties.prohibitedTargetCombatantStates;

  const filteredTargetsResult = filterPossibleTargetIdsByProhibitedCombatantStates(
    party,
    prohibitedTargetCombatantStates,
    allyIdsOption,
    opponentIdsOption
  );
  if (filteredTargetsResult instanceof Error) return filteredTargetsResult;

  [allyIdsOption, opponentIdsOption] = filteredTargetsResult;

  [allyIdsOption, opponentIdsOption] = filterPossibleTargetIdsByActionTargetCategories(
    combatActionProperties.validTargetCategories,
    characterId,
    allyIdsOption,
    opponentIdsOption
  );

  return [allyIdsOption, opponentIdsOption];
}
