import { MenuStateType } from "@/app/game/ActionMenu/menu-state";

export function shouldShowCharacterSheet(currentMenuType: MenuStateType) {
  return (
    currentMenuType === MenuStateType.InventoryItems ||
    currentMenuType === MenuStateType.ViewingEquipedItems ||
    currentMenuType === MenuStateType.AssignAttributePoints ||
    currentMenuType === MenuStateType.ItemSelected ||
    viewingAbilityTree(currentMenuType)
  );
}

export function viewingAbilityTree(currentMenuType: MenuStateType) {
  return (
    currentMenuType === MenuStateType.ViewingAbilityTree ||
    currentMenuType === MenuStateType.ConsideringAbilityTreeColumn ||
    currentMenuType === MenuStateType.ConsideringAbilityTreeAbility
  );
}
