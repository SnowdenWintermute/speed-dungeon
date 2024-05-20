import { CombatantAbilityNames } from "../../combatants";

export enum CombatActionType {
  AbilityUsed,
  ConsumableUsed,
}

interface AbilityUsed {
  type: CombatActionType.AbilityUsed;
  abilityName: CombatantAbilityNames;
}

interface ConsumableUsed {
  type: CombatActionType.ConsumableUsed;
  itemId: string;
}

export type CombatAction = ConsumableUsed | AbilityUsed;
