import { AdventuringParty } from "../../adventuring-party/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "../../game/index.js";
import getOwnedCharacterAndSelectedCombatAction from "../../utils/get-owned-character-and-selected-combat-action.js";
import assignCharacterActionTargets from "./assign-character-action-targets.js";

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
  const { character, combatActionProperties } = characterAndActionDataResult;

  if (combatActionProperties.targetingSchemes.length < 2)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.ONLY_ONE_TARGETING_SCHEME_AVAILABLE);

  const lastUsedTargetingScheme = player.targetPreferences.targetingSchemePreference;
  const { targetingSchemes } = combatActionProperties;
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

  const assignNewTargetsResult = assignCharacterActionTargets(
    game,
    character.entityProperties.id,
    player.username,
    combatActionProperties
  );

  if (assignNewTargetsResult instanceof Error) return assignNewTargetsResult;
}
