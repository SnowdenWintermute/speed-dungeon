import { MenuStateType } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { AbilityTreeMenuState } from "@/app/game/ActionMenu/menu-state/ability-tree-menu-state";
import { AssigningAttributePointsMenuState } from "@/app/game/ActionMenu/menu-state/assigning-attribute-points";
import { BaseMenuState } from "@/app/game/ActionMenu/menu-state/base";
import { ConvertToShardItemSelectionMenuState } from "@/app/game/ActionMenu/menu-state/convert-to-shard-item-selection";
import { CraftingItemSelectionMenuState } from "@/app/game/ActionMenu/menu-state/crafting-item-selection";
import { EquippedItemsMenuState } from "@/app/game/ActionMenu/menu-state/equipped-items";
import { InventoryItemsMenuState } from "@/app/game/ActionMenu/menu-state/inventory-items";
import { ItemsOnGroundMenuState } from "@/app/game/ActionMenu/menu-state/items-on-ground";
import { OperatingVendingMachineMenuState } from "@/app/game/ActionMenu/menu-state/operating-vending-machine";
import { PurchaseItemsMenuState } from "@/app/game/ActionMenu/menu-state/purchase-items";
import { RepairItemSelectionMenuState } from "@/app/game/ActionMenu/menu-state/repair-item-selection";
import { SelectBookToTradeForMenuState } from "@/app/game/ActionMenu/menu-state/select-book-type";
import { ActionMenuState } from "@/app/game/ActionMenu/menu-state";

export class MenuStatePool {
  private static _pool: Partial<Record<MenuStateType, ActionMenuState>> | null = null;

  static get(menuStateType: MenuStateType) {
    if (MenuStatePool._pool === null) {
      MenuStatePool._pool = {
        [MenuStateType.Base]: new BaseMenuState(),
        [MenuStateType.AssignAttributePoints]: new AssigningAttributePointsMenuState(),
        [MenuStateType.InventoryItems]: new InventoryItemsMenuState(),
        [MenuStateType.ViewingEquipedItems]: new EquippedItemsMenuState(),
        [MenuStateType.ItemsOnGround]: new ItemsOnGroundMenuState(),
        [MenuStateType.OperatingVendingMachine]: new OperatingVendingMachineMenuState(),
        [MenuStateType.PurchasingItems]: new PurchaseItemsMenuState(),
        [MenuStateType.CraftingItemSelection]: new CraftingItemSelectionMenuState(),
        [MenuStateType.RepairItemSelection]: new RepairItemSelectionMenuState(),
        [MenuStateType.ShardItemSelection]: new ConvertToShardItemSelectionMenuState(),
        [MenuStateType.ViewingAbilityTree]: new AbilityTreeMenuState(),
        [MenuStateType.SelectingBookType]: new SelectBookToTradeForMenuState(),
      };
    }

    const stored = MenuStatePool._pool[menuStateType];
    if (stored === undefined) {
      throw new Error("tried to access a menu state that isn't stored in the pool");
    }

    return stored;
  }
}
