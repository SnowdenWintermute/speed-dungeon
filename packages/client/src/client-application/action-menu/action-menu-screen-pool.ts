import { ActionMenuScreen } from "./screens";
import { ActionMenuScreenType } from "./screens/screen-types";
import { BaseActionMenuScreen } from "./screens/base";

export class ActionMenuScreenPool {
  private _pool: Partial<Record<ActionMenuScreenType, ActionMenuScreen>> | null = null;

  get(menuStateType: ActionMenuScreenType) {
    if (this._pool === null) {
      this._pool = {
        [ActionMenuScreenType.Base]: new BaseActionMenuScreen(),
        [ActionMenuScreenType.AssignAttributePoints]:
          new AssigningAttributePointsActionMenuScreen(),
        [ActionMenuScreenType.InventoryItems]: new InventoryItemsActionMenuScreen(),
        [ActionMenuScreenType.ViewingEquipedItems]: new EquippedItemsActionMenuScreen(),
        [ActionMenuScreenType.ItemsOnGround]: new ItemsOnGroundActionMenuScreen(),
        [ActionMenuScreenType.OperatingVendingMachine]:
          new OperatingVendingMachineActionMenuScreen(),
        [ActionMenuScreenType.PurchasingItems]: new PurchaseItemsActionMenuScreen(),
        [ActionMenuScreenType.CraftingItemSelection]: new CraftingItemSelectionActionMenuScreen(),
        [ActionMenuScreenType.RepairItemSelection]: new RepairItemSelectionActionMenuScreen(),
        [ActionMenuScreenType.ShardItemSelection]:
          new ConvertToShardItemSelectionActionMenuScreen(),
        [ActionMenuScreenType.ViewingAbilityTree]: new AbilityTreeActionMenuScreen(),
        [ActionMenuScreenType.SelectingBookType]: new SelectBookToTradeForActionMenuScreen(),
      };
    }

    const stored = this._pool[menuStateType];
    if (stored === undefined) {
      throw new Error("tried to access a menu state that isn't stored in the pool");
    }

    return stored;
  }
}
