import {
  AbilityTreeAbility,
  CharacterAssociatedData,
  CombatantProperties,
  ERROR_MESSAGES,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

export function characterAllocatedAbilityPointHandler(
  eventData: { characterId: string; ability: AbilityTreeAbility },
  characterAssociatedData: CharacterAssociatedData
) {
  const { ability } = eventData;
  const { game, party, character } = characterAssociatedData;
  const { combatantProperties } = character;
  if (combatantProperties.unspentAbilityPoints <= 0)
    return new Error(ERROR_MESSAGES.COMBATANT.NO_UNSPENT_ABILITY_POINTS);

  // check if required character level to increment this ability
  // check if this abliity is max level
  // check if prerequisite abilities are owned

  getGameServer()
    .io.in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterAllocatedAbilityPoint, {
      characterId: character.entityProperties.id,
      ability,
    });
}
