import {
  AbilityTreeAbility,
  CharacterAssociatedData,
  CombatantAbilityProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export function characterAllocatedAbilityPointHandler(eventData: {
  characterId: string;
  ability: AbilityTreeAbility;
}) {
  const { characterId, ability } = eventData;
  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    CombatantAbilityProperties.allocateAbilityPoint(character.combatantProperties, ability);
  });
}
