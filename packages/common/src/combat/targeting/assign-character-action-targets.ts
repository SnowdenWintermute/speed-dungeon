import { CombatActionProperties } from "..";
import { Battle } from "../../battle";
import { ERROR_MESSAGES } from "../../errors";
import { SpeedDungeonGame } from "../../game";
import getPlayerParty from "../../game/get-player-party";
import { CombatActionTarget } from "./combat-action-targets";
import {
  filterPossibleTargetIdsByActionTargetCategories,
  filterPossibleTargetIdsByProhibitedCombatantStates,
} from "./filtering";
import getActionTargetsBySavedPreferenceOrDefault from "./get-action-targets-by-saved-preference-or-default";
import getUpdatedTargetPreferences from "./get-updated-target-preferences";

export default function assignCharacterActionTargets(
  game: SpeedDungeonGame,
  characterId: string,
  username: string,
  combatActionPropertiesOption: null | CombatActionProperties
): Error | null | CombatActionTarget {
  const partyResult = getPlayerParty(game, username);
  if (partyResult instanceof Error) return partyResult;
  const characterResult = game.getCharacter(partyResult.name, characterId);
  if (characterResult instanceof Error) return characterResult;
  const party = partyResult;
  const character = characterResult;

  if (!combatActionPropertiesOption) {
    character.combatantProperties.combatActionTarget = null;
    return null;
  }

  const combatActionProperties = combatActionPropertiesOption;

  let allyIdsOption: null | string[] = party.characterPositions;
  let opponentIdsOption: null | string[] = null;

  if (party.battleId) {
    const battleOption = game.battles[party.battleId];
    if (!battleOption) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    const allyAndOponnentIdsResult = Battle.getAllyIdsAndOpponentIdsOption(
      battleOption,
      characterId
    );
    if (allyAndOponnentIdsResult instanceof Error) return allyAndOponnentIdsResult;
    opponentIdsOption = allyAndOponnentIdsResult.opponentIdsOption;
  }

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

  const playerOption = game.players[username];
  if (!playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
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
