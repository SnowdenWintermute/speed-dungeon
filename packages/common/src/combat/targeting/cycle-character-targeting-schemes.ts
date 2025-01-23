import { AdventuringParty } from "../../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "../../game/index.js";
import getOwnedCharacterAndSelectedCombatAction from "../../utils/get-owned-character-and-selected-combat-action.js";
import { TargetingCalculator } from "./targeting-calculator.js";

export default function cycleCharacterTargetingSchemes(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  player: SpeedDungeonPlayer,
  characterId: string
): Error | void {
  const characterAndActionDataResult = getOwnedCharacterAndSelectedCombatAction(
    party,
    player,
    characterId
  );
  if (characterAndActionDataResult instanceof Error) return characterAndActionDataResult;
  const { character, combatAction } = characterAndActionDataResult;

  if (combatAction.targetingSchemes.length < 2)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.ONLY_ONE_TARGETING_SCHEME_AVAILABLE);

  const targetingCalculator = new TargetingCalculator(game, party, character, player);

  const lastUsedTargetingScheme = player.targetPreferences.targetingSchemePreference;
  const { targetingSchemes } = combatAction;
  let newTargetingScheme = lastUsedTargetingScheme;

  if (!targetingSchemes.includes(lastUsedTargetingScheme)) {
    const defaultTargetingScheme = targetingSchemes[0];
    if (typeof defaultTargetingScheme === "undefined")
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGETING_SCHEMES);
    newTargetingScheme = defaultTargetingScheme;
  } else {
    const lastUsedTargetingSchemeIndex = targetingSchemes.indexOf(lastUsedTargetingScheme);
    if (lastUsedTargetingSchemeIndex < 0)
      return new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
    const newSchemeIndex =
      lastUsedTargetingSchemeIndex === targetingSchemes.length - 1
        ? 0
        : lastUsedTargetingSchemeIndex + 1;
    newTargetingScheme = targetingSchemes[newSchemeIndex]!;
  }

  player.targetPreferences.targetingSchemePreference = newTargetingScheme;

  const filteredTargetIdsResult =
    targetingCalculator.getFilteredPotentialTargetIdsForAction(combatAction);
  if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
  const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;
  const newTargetsResult = targetingCalculator.getValidPreferredOrDefaultActionTargets(
    combatAction,
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
