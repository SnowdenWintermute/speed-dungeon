import {
  CharacterAndSlot,
  CharacterAssociatedData,
  ClientToServerEvent,
  CombatantProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { websocketConnection } from "@/singletons/websocket-connection";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelManagerMessageType } from "@/app/3d-world/game-world/model-manager";

export default function characterDroppedEquippedItemHandler(characterAndSlot: CharacterAndSlot) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemDroppedIdResult = CombatantProperties.dropEquippedItem(
      party,
      character.combatantProperties,
      slot
    );
    if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;

    websocketConnection.emit(
      ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate,
      itemDroppedIdResult
    );
    gameWorld.current?.modelManager.enqueueMessage(characterId, {
      type: ModelManagerMessageType.ChangeEquipment,
      unequippedSlots: [slot],
      hotswapSlotIndex: character.combatantProperties.equipment.equippedHoldableHotswapSlotIndex,
    });
  });
}
