export * from "./calculate-combat-action-hp-change-range";

import { CombatantAbilityNames } from "../../combatants";

export enum CombatActionType {
  AbilityUsed,
  ConsumableUsed,
}

export interface AbilityUsed {
  type: CombatActionType.AbilityUsed;
  abilityName: CombatantAbilityNames;
}

export interface ConsumableUsed {
  type: CombatActionType.ConsumableUsed;
  itemId: string;
}

export type CombatAction = ConsumableUsed | AbilityUsed;
