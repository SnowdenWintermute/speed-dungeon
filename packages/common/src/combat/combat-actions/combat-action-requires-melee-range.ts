import { CombatAction, CombatActionType } from "..";
import getAbilityAttributes from "../../combatants/abilities/get-ability-attributes";

export default function combatActionRequiresMeleeRange(combatAction: CombatAction): boolean {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      return getAbilityAttributes(combatAction.abilityName).isMelee;
    case CombatActionType.ConsumableUsed:
      return false;
  }
}
