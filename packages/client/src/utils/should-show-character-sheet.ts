import { MenuStateType } from "@/app/game/ActionMenu/menu-state";

export default function shouldShowCharacterSheet(currentMenuType: MenuStateType) {
  return (
    currentMenuType === MenuStateType.InventoryItems ||
    currentMenuType === MenuStateType.ViewingEquipedItems ||
    currentMenuType === MenuStateType.AssignAttributePoints ||
    currentMenuType === MenuStateType.ItemSelected ||
    currentMenuType === MenuStateType.ViewingAbilityTree ||
    currentMenuType === MenuStateType.ConsideringAbilityTreeColumn
  );
}
