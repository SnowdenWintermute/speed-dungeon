import { ConsumableType } from "@speed-dungeon/common/src/items/consumables";
import { MenuType } from "./determine-action-menu-item-types";
import { CombatantAbilityName } from "@speed-dungeon/common";
import CombatActionProperties from "@speed-dungeon/common/src/combat/combat-actions/combat-action-properties";

export default function createActionMenuGameActions(
  menuTypes: MenuType[],
  equipmentIds: string[],
  consumableIdsByType: Partial<Record<ConsumableType, string[]>>,
  abilities: CombatantAbilityName[],
  selectedCombatActionPropertiesOption: null | CombatActionProperties,
  inventoryIsOpen: boolean
) {
  //
}
