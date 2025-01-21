import { CombatAction, CombatActionType } from "../combat/index.js";
import { ConsumableType } from "../items/consumables/index.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { CombatantProperties } from "./index.js";

export function getAllUsableActionsCombatantCanPerform(
  combatantProperties: CombatantProperties,
  isInCombat: boolean
) {
  const usableActions: CombatAction[] = [];

  for (const [abilityName, ability] of iterateNumericEnumKeyedRecord(
    combatantProperties.abilities
  )) {
    if (!CombatantProperties.canUseOwnedAbility(combatantProperties, ability, isInCombat)) continue;
    usableActions.push({ type: CombatActionType.AbilityUsed, abilityName });
  }

  const consumableTypeActions: Set<ConsumableType> = new Set();

  for (const consumable of combatantProperties.inventory.consumables) {
    if (consumableTypeActions.size === Object.keys(ConsumableType).length) break;
    if (consumableTypeActions.has(consumable.consumableType)) continue;
    consumableTypeActions.add(consumable.consumableType);
    usableActions.push({
      type: CombatActionType.ConsumableUsed,
      itemId: consumable.entityProperties.id,
    });
  }

  return usableActions;
}
