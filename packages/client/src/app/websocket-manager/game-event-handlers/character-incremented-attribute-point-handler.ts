import { CharacterAssociatedData, CombatAttribute } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export function characterIncrementedAttributePointHandler(
  characterId: string,
  attribute: CombatAttribute
) {
  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    character.combatantProperties.attributeProperties.allocatePoint(attribute);
  });
}
