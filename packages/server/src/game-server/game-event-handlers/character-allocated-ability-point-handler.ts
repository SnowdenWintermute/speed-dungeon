import {
  AbilityTreeAbility,
  CharacterAssociatedData,
  CombatantAbilityProperties,
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

  if (combatantProperties.abilityProperties.unspentAbilityPoints <= 0)
    return new Error(ERROR_MESSAGES.COMBATANT.NO_UNSPENT_ABILITY_POINTS);

  const canAllocate = CombatantAbilityProperties.canAllocateAbilityPoint(
    combatantProperties,
    ability
  );
  if (!canAllocate) return new Error("Can't allocate a point to that ability");

  CombatantAbilityProperties.allocateAbilityPoint(combatantProperties, ability);

  getGameServer()
    .io.in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterAllocatedAbilityPoint, {
      characterId: character.entityProperties.id,
      ability,
    });
}
