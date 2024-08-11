import { CombatActionProperties } from "..";
import { ERROR_MESSAGES } from "../../errors";
import { SpeedDungeonGame } from "../../game";
import getCharacterInGame from "../../game/get-character-in-game";
import { getPlayerParty } from "../../game/get-player-party";
import { CombatActionTarget } from "./combat-action-targets";
import getActionTargetsBySavedPreferenceOrDefault from "./get-action-targets-by-saved-preference-or-default";
import getFilteredPotentialTargetIds from "./get-filtered-potential-target-ids";
import getUpdatedTargetPreferences from "./get-updated-target-preferences";

export default function assignCharacterActionTargets(
  game: SpeedDungeonGame,
  characterId: string,
  username: string,
  combatActionPropertiesOption: null | CombatActionProperties
): Error | null | CombatActionTarget {
  const partyResult = getPlayerParty(game, username);
  if (partyResult instanceof Error) return partyResult;
  const characterResult = getCharacterInGame(game, partyResult.name, characterId);
  if (characterResult instanceof Error) return characterResult;
  const party = partyResult;
  const character = characterResult;

  if (combatActionPropertiesOption === null) {
    character.combatantProperties.combatActionTarget = null;
    return null;
  }

  const combatActionProperties = combatActionPropertiesOption;

  const filteredTargetIdsResult = getFilteredPotentialTargetIds(
    game,
    party,
    characterId,
    combatActionProperties
  );
  if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
  const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;

  const playerOption = game.players[username];
  if (playerOption === undefined) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  const player = playerOption;
  const targetPreferences = playerOption.targetPreferences;

  const newTargetsResult = getActionTargetsBySavedPreferenceOrDefault(
    player,
    combatActionProperties,
    allyIdsOption,
    opponentIdsOption
  );

  if (newTargetsResult instanceof Error) return newTargetsResult;

  const newTargetPreferences = getUpdatedTargetPreferences(
    targetPreferences,
    combatActionProperties,
    newTargetsResult,
    allyIdsOption,
    opponentIdsOption
  );

  player.targetPreferences = newTargetPreferences;
  character.combatantProperties.combatActionTarget = newTargetsResult;

  return newTargetsResult;
}
