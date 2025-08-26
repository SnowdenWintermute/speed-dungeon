import {
  ABILITY_TREES,
  AbilityTreeAbility,
  AbilityUtils,
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

  const isMainClassAbility = AbilityUtils.abilityAppearsInTree(
    ability,
    ABILITY_TREES[combatantProperties.combatantClass]
  );
  const isSupportClassAbility = !!(
    combatantProperties.supportClassProperties &&
    AbilityUtils.abilityAppearsInTree(
      ability,
      ABILITY_TREES[combatantProperties.supportClassProperties?.combatantClass]
    )
  );

  if (!isSupportClassAbility && !isMainClassAbility)
    return new Error("That ability is not in any of that combatant's ability trees");

  const { canAllocate, reasonCanNot } = CombatantAbilityProperties.canAllocateAbilityPoint(
    combatantProperties,
    ability,
    isSupportClassAbility
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
