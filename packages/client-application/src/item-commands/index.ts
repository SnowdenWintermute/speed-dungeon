import { ClientIntentType, CombatantId, ItemId, TaggedEquipmentSlot } from "@speed-dungeon/common";
import { ClientApplication } from "..";

export class ItemCommands {
  constructor(private clientApplication: ClientApplication) {}

  equipItem(characterId: CombatantId, itemId: ItemId, options: { alternate: boolean }) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.EquipInventoryItem,
      data: { characterId, itemId, equipToAlternateSlot: options.alternate },
    });
  }

  unequipSlot(characterId: CombatantId, slot: TaggedEquipmentSlot) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.UnequipSlot,
      data: { characterId, slot },
    });
  }

  dropItem(characterId: CombatantId, itemId: ItemId) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.DropItem,
      data: { characterId, itemId },
    });
  }

  dropEquippedItem(characterId: CombatantId, slot: TaggedEquipmentSlot) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.DropEquippedItem,
      data: { characterId, slot },
    });
  }

  pickUpItems(characterId: CombatantId, itemIds: ItemId[]) {
    this.clientApplication.gameClientRef.get().dispatchIntent({
      type: ClientIntentType.PickUpItems,
      data: { characterId, itemIds },
    });
  }
}
