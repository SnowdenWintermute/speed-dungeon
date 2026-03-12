import { ActionMenuScreenType } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { AbilityTreeActionMenuScreen } from "@/app/game/ActionMenu/menu-state/ability-tree-menu-state";
import { AssigningAttributePointsActionMenuScreen } from "@/app/game/ActionMenu/menu-state/assigning-attribute-points";
import { BaseActionMenuScreen } from "@/app/game/ActionMenu/menu-state/base";
import { ConvertToShardItemSelectionActionMenuScreen } from "@/app/game/ActionMenu/menu-state/convert-to-shard-item-selection";
import { CraftingItemSelectionActionMenuScreen } from "@/app/game/ActionMenu/menu-state/crafting-item-selection";
import { EquippedItemsActionMenuScreen } from "@/app/game/ActionMenu/menu-state/equipped-items";
import { InventoryItemsActionMenuScreen } from "@/app/game/ActionMenu/menu-state/inventory-items";
import { ItemsOnGroundActionMenuScreen } from "@/app/game/ActionMenu/menu-state/items-on-ground";
import { OperatingVendingMachineActionMenuScreen } from "@/app/game/ActionMenu/menu-state/operating-vending-machine";
import { PurchaseItemsActionMenuScreen } from "@/app/game/ActionMenu/menu-state/purchase-items";
import { RepairItemSelectionActionMenuScreen } from "@/app/game/ActionMenu/menu-state/repair-item-selection";
import { SelectBookToTradeForActionMenuScreen } from "@/app/game/ActionMenu/menu-state/select-book-type";
import { ActionMenuScreen } from "@/app/game/ActionMenu/menu-state";

export class ActionMenuScreenPool {
  private static _pool: Partial<Record<ActionMenuScreenType, ActionMenuScreen>> | null = null;

  static get(menuStateType: ActionMenuScreenType) {
    if (ActionMenuScreenPool._pool === null) {
      ActionMenuScreenPool._pool = {
        [ActionMenuScreenType.Base]: new BaseActionMenuScreen(),
        [ActionMenuScreenType.AssignAttributePoints]: new AssigningAttributePointsActionMenuScreen(),
        [ActionMenuScreenType.InventoryItems]: new InventoryItemsActionMenuScreen(),
        [ActionMenuScreenType.ViewingEquipedItems]: new EquippedItemsActionMenuScreen(),
        [ActionMenuScreenType.ItemsOnGround]: new ItemsOnGroundActionMenuScreen(),
        [ActionMenuScreenType.OperatingVendingMachine]: new OperatingVendingMachineActionMenuScreen(),
        [ActionMenuScreenType.PurchasingItems]: new PurchaseItemsActionMenuScreen(),
        [ActionMenuScreenType.CraftingItemSelection]: new CraftingItemSelectionActionMenuScreen(),
        [ActionMenuScreenType.RepairItemSelection]: new RepairItemSelectionActionMenuScreen(),
        [ActionMenuScreenType.ShardItemSelection]: new ConvertToShardItemSelectionActionMenuScreen(),
        [ActionMenuScreenType.ViewingAbilityTree]: new AbilityTreeActionMenuScreen(),
        [ActionMenuScreenType.SelectingBookType]: new SelectBookToTradeForActionMenuScreen(),
      };
    }

    const stored = ActionMenuScreenPool._pool[menuStateType];
    if (stored === undefined) {
      throw new Error("tried to access a menu state that isn't stored in the pool");
    }

    return stored;
  }
}
