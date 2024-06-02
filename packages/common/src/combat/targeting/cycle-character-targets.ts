import { AdventuringParty } from "../../adventuring_party";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "../../game";
import { NextOrPrevious } from "../../primatives";
import getOwnedCharacterAndSelectedCombatAction from "../../utils/get-owned-character-and-selected-combat-action";
import getFilteredPotentialTargetIds from "./get-filtered-potential-target-ids";
import getNextOrPreviousTarget from "./get-next-or-previous-target";
import getUpdatedTargetPreferences from "./get-updated-target-preferences";

export default function cycleCharacterTargets(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  player: SpeedDungeonPlayer,
  characterId: string,
  direction: NextOrPrevious
): Error | void {
  const characterAndActionDataResult = getOwnedCharacterAndSelectedCombatAction(
    party,
    player,
    characterId
  );
  if (characterAndActionDataResult instanceof Error) return characterAndActionDataResult;
  const { character, combatActionProperties, currentTarget } = characterAndActionDataResult;

  const filteredTargetIdsResult = getFilteredPotentialTargetIds(
    game,
    party,
    characterId,
    combatActionProperties
  );
  if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
  const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;

  const newTargetsResult = getNextOrPreviousTarget(
    combatActionProperties,
    currentTarget,
    direction,
    characterId,
    allyIdsOption,
    opponentIdsOption
  );
  if (newTargetsResult instanceof Error) return newTargetsResult;

  player.targetPreferences = getUpdatedTargetPreferences(
    player.targetPreferences,
    combatActionProperties,
    newTargetsResult,
    allyIdsOption,
    opponentIdsOption
  );

  character.combatantProperties.combatActionTarget = newTargetsResult;
}
