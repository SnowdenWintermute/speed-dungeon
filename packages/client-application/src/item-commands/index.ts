import { ClientIntentType, CombatantId, EquipmentSlotId, ItemId } from "@speed-dungeon/common";
import { ClientApplication } from "..";

export class ItemCommands {
  constructor(private clientApplication: ClientApplication) {}

  equipItem(characterId: CombatantId, itemId: ItemId, options: { alternate: boolean }) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.EquipInventoryItem,
      data: { characterId, itemId, equipToAlternateSlot: options.alternate },
    });
  }

  equipItemFromGround(characterId: CombatantId, itemId: ItemId, options: { alternate: boolean }) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.EquipItemFromGround,
      data: { characterId, itemId, equipToAlternateSlot: options.alternate },
    });
  }

  moveEquippedItemToSlot(
    characterId: CombatantId,
    sourceSlotId: EquipmentSlotId,
    destinationSlotId: EquipmentSlotId
  ) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.MoveEquippedItemToSlot,
      data: { characterId, sourceSlotId, destinationSlotId },
    });
  }

  unequipSlot(characterId: CombatantId, slotId: EquipmentSlotId) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.UnequipSlot,
      data: { characterId, slotId },
    });
  }

  dropItem(characterId: CombatantId, itemId: ItemId) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.DropItem,
      data: { characterId, itemId },
    });
  }

  dropEquippedItem(characterId: CombatantId, slotId: EquipmentSlotId) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.DropEquippedItem,
      data: { characterId, slotId },
    });
  }

  pickUpItems(characterId: CombatantId, itemIds: ItemId[]) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.PickUpItems,
      data: { characterId, itemIds },
    });
  }
}
