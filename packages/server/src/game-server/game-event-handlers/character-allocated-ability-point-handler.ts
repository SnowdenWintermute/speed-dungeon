import {
  AbilityTreeAbility,
  CharacterAssociatedData,
  CombatantAbilityProperties,
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

  const { canAllocate, reasonCanNot } = CombatantAbilityProperties.canAllocateAbilityPoint(
    combatantProperties,
    ability
  );
  if (!canAllocate) return new Error(reasonCanNot);

  CombatantAbilityProperties.allocateAbilityPoint(combatantProperties, ability);

  getGameServer()
    .io.in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterAllocatedAbilityPoint, {
      characterId: character.entityProperties.id,
      ability,
    });
}
