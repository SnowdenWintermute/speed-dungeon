import {
  CharacterAndSlot,
  CharacterAssociatedData,
  CombatantProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelManagerMessageType } from "@/app/3d-world/game-world/model-manager";

export default function characterUnequippedSlotHandler(characterAndSlot: CharacterAndSlot) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    const _itemDroppedIds = CombatantProperties.unequipSlots(character.combatantProperties, [slot]);
    gameWorld.current?.modelManager.enqueueMessage(characterId, {
      type: ModelManagerMessageType.ChangeEquipment,
      unequippedSlots: [slot],
      hotswapSlotIndex: character.combatantProperties.equipment.equippedHoldableHotswapSlotIndex,
    });
  });
}
