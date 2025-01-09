import { MenuStateType } from "@/app/game/ActionMenu/menu-state";

export function playerIsOperatingVendingMachine(currentMenuType: MenuStateType) {
  const vendingMachineMenuTypes = [
    MenuStateType.PurchasingItems,
    MenuStateType.CraftingItemSelection,
    MenuStateType.OperatingVendingMachine,
    MenuStateType.CraftingActionSelection,
  ];
  return vendingMachineMenuTypes.includes(currentMenuType);
}
