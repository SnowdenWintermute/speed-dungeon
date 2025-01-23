import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "../../game/index.js";
import { NextOrPrevious } from "../../primatives/index.js";
import getOwnedCharacterAndSelectedCombatAction from "../../utils/get-owned-character-and-selected-combat-action.js";
import getNextOrPreviousTarget from "./get-next-or-previous-target.js";
import { TargetingCalculator } from "./targeting-calculator.js";

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
  const { character, combatAction, currentTarget } = characterAndActionDataResult;

  const targetingCalculator = new TargetingCalculator(game, party, character, player);

  const filteredTargetIdsResult =
    targetingCalculator.getFilteredPotentialTargetIdsForAction(combatAction);
  if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
  const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;

  const newTargetsResult = getNextOrPreviousTarget(
    combatAction,
    currentTarget,
    direction,
    characterId,
    allyIdsOption,
    opponentIdsOption
  );
  if (newTargetsResult instanceof Error) return newTargetsResult;

  const updatedTargetPreferenceResult = targetingCalculator.getUpdatedTargetPreferences(
    combatAction,
    newTargetsResult,
    allyIdsOption,
    opponentIdsOption
  );
  if (updatedTargetPreferenceResult instanceof Error) return updatedTargetPreferenceResult;

  player.targetPreferences = updatedTargetPreferenceResult;
  character.combatantProperties.combatActionTarget = newTargetsResult;
}
