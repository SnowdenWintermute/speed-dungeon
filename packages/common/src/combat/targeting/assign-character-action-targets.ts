import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import getCharacterInGame from "../../game/get-character-in-game.js";
import { CombatActionTarget } from "./combat-action-targets.js";
import getActionTargetsBySavedPreferenceOrDefault from "./get-action-targets-by-saved-preference-or-default.js";
import getFilteredPotentialTargetIds from "./get-filtered-potential-target-ids.js";
import { CombatActionComponent } from "../combat-actions/index.js";
import setAndReturnUpdatedTargetPreferences from "./set-and-return-updated-target-preferences.js";

export function assignCharacterActionTargets(
  game: SpeedDungeonGame,
  characterId: string,
  username: string,
  combatActionOption: null | CombatActionComponent
): Error | null | CombatActionTarget {
  const partyResult = SpeedDungeonGame.getPlayerPartyOption(game, username);
  if (partyResult instanceof Error) return partyResult;
  if (partyResult === undefined) return new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  const characterResult = getCharacterInGame(game, partyResult.name, characterId);
  if (characterResult instanceof Error) return characterResult;
  const party = partyResult;
  const character = characterResult;

  if (combatActionOption === null) {
    character.combatantProperties.combatActionTarget = null;
    return null;
  }

  const combatActionProperties = combatActionOption;

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
  const targetPreferences = playerOption.targetPreferences;

  const newTargetsResult = getActionTargetsBySavedPreferenceOrDefault(
    targetPreferences,
    combatActionProperties,
    allyIdsOption,
    opponentIdsOption
  );

  if (newTargetsResult instanceof Error) return newTargetsResult;

  const newTargetPreferences = setAndReturnUpdatedTargetPreferences(
    playerOption,
    combatActionProperties,
    newTargetsResult,
    allyIdsOption,
    opponentIdsOption
  );

  character.combatantProperties.combatActionTarget = newTargetsResult;

  return newTargetsResult;
}
