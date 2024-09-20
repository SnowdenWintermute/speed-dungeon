import { CombatAction, CombatActionType } from "../index.js";
import getAbilityAttributes from "../../combatants/abilities/get-ability-attributes.js";

export function combatActionRequiresMeleeRange(combatAction: CombatAction): boolean {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      return getAbilityAttributes(combatAction.abilityName).isMelee;
    case CombatActionType.ConsumableUsed:
      return false;
  }
}
