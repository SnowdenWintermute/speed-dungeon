import { ActionMenuScreen } from "./screens";
import { AssigningAttributePointsActionMenuScreen } from "./screens/assigning-attribute-points";
import { ActionMenuScreenType } from "./screen-types";
import { InventoryItemsActionMenuScreen } from "./screens/items-in-inventory";
import { EquippedItemsActionMenuScreen } from "./screens/items-equipped";
import { ItemsOnGroundActionMenuScreen } from "./screens/items-on-ground";
import { OperatingVendingMachineActionMenuScreen } from "./screens/vending-machine-root";
import { PurchaseItemsActionMenuScreen } from "./screens/purchase-items";
import { CraftingItemSelectionActionMenuScreen } from "./screens/crafting-item-select";
import { RepairItemSelectionActionMenuScreen } from "./screens/repair-item-select";
import { ConvertToShardItemSelectionActionMenuScreen } from "./screens/convert-to-shards-item-select";
import { AbilityTreeActionMenuScreen } from "./screens/ability-tree-root";
import { SelectBookToTradeForActionMenuScreen } from "./screens/trade-for-book-type-select";
import { ClientApplication } from "..";
import { RootActionMenuScreen } from "./screens/root";

export class ActionMenuScreenPool {
  constructor(private clientApplication: ClientApplication) {}
  private _pool: Partial<Record<ActionMenuScreenType, ActionMenuScreen>> | null = null;

  get(menuStateType: ActionMenuScreenType) {
    if (this._pool === null) {
      this._pool = {
        [ActionMenuScreenType.Root]: new RootActionMenuScreen(this.clientApplication),
        [ActionMenuScreenType.AssignAttributePoints]: new AssigningAttributePointsActionMenuScreen(
          this.clientApplication
        ),
        [ActionMenuScreenType.InventoryItems]: new InventoryItemsActionMenuScreen(
          this.clientApplication
        ),
        [ActionMenuScreenType.ViewingEquipedItems]: new EquippedItemsActionMenuScreen(
          this.clientApplication
        ),
        [ActionMenuScreenType.ItemsOnGround]: new ItemsOnGroundActionMenuScreen(
          this.clientApplication
        ),
        [ActionMenuScreenType.OperatingVendingMachine]: new OperatingVendingMachineActionMenuScreen(
          this.clientApplication
        ),
        [ActionMenuScreenType.PurchasingItems]: new PurchaseItemsActionMenuScreen(
          this.clientApplication
        ),
        [ActionMenuScreenType.CraftingItemSelection]: new CraftingItemSelectionActionMenuScreen(
          this.clientApplication
        ),
        [ActionMenuScreenType.RepairItemSelection]: new RepairItemSelectionActionMenuScreen(
          this.clientApplication
        ),
        [ActionMenuScreenType.ShardItemSelection]: new ConvertToShardItemSelectionActionMenuScreen(
          this.clientApplication
        ),
        [ActionMenuScreenType.ViewingAbilityTree]: new AbilityTreeActionMenuScreen(
          this.clientApplication
        ),
        [ActionMenuScreenType.SelectingBookType]: new SelectBookToTradeForActionMenuScreen(
          this.clientApplication
        ),
      };
    }

    const stored = this._pool[menuStateType];
    if (stored === undefined) {
      throw new Error("tried to access a menu state that isn't stored in the pool");
    }

    return stored;
  }
}
