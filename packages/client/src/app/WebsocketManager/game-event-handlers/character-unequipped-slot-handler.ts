import {
  CharacterAndSlot,
  CharacterAssociatedData,
  CombatantProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterUnequippedSlotHandler(characterAndSlot: CharacterAndSlot) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    const _itemDroppedIds = CombatantProperties.unequipSlots(character.combatantProperties, [slot]);
  });
}
