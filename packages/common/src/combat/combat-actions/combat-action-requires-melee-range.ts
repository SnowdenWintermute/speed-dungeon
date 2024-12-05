import { CombatAction, CombatActionType } from "../index.js";
import { ABILITY_ATTRIBUTES } from "../../combatants/abilities/get-ability-attributes.js";

export function combatActionRequiresMeleeRange(combatAction: CombatAction): boolean {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      return ABILITY_ATTRIBUTES[combatAction.abilityName].isMelee;
    case CombatActionType.ConsumableUsed:
      return false;
  }
}
