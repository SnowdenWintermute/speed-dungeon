import {
  AbilityTreeAbility,
  CharacterAssociatedData,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";

export function characterAllocatedAbilityPointHandler(
  eventData: { characterId: string; ability: AbilityTreeAbility },
  characterAssociatedData: CharacterAssociatedData
) {
  const { ability } = eventData;
  const { game, party, character } = characterAssociatedData;
  const { combatantProperties } = character;

  const { canAllocate, reasonCanNot } =
    combatantProperties.abilityProperties.canAllocateAbilityPoint(ability);
  if (!canAllocate) return new Error(reasonCanNot);

  combatantProperties.abilityProperties.allocateAbilityPoint(ability);

  getGameServer()
    .io.in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterAllocatedAbilityPoint, {
      characterId: character.entityProperties.id,
      ability,
    });
}
