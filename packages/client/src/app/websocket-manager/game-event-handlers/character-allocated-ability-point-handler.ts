import { AbilityTreeAbility, CharacterAssociatedData } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export function characterAllocatedAbilityPointHandler(eventData: {
  characterId: string;
  ability: AbilityTreeAbility;
}) {
  const { characterId, ability } = eventData;
  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    character.combatantProperties.abilityProperties.allocateAbilityPoint(ability);
  });
}
