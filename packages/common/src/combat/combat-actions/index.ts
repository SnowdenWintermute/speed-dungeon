export * from "./calculate-combat-action-hp-change-range";
export * from "./combat-action-properties";
export * from "./get-ability-mana-cost";
export * from "./combat-action-requires-melee-range";

import { CombatantAbilityName } from "../../combatants";

export enum CombatActionType {
  AbilityUsed,
  ConsumableUsed,
}

export interface AbilityUsed {
  type: CombatActionType.AbilityUsed;
  abilityName: CombatantAbilityName;
}

export interface ConsumableUsed {
  type: CombatActionType.ConsumableUsed;
  itemId: string;
}

export type CombatAction = ConsumableUsed | AbilityUsed;
