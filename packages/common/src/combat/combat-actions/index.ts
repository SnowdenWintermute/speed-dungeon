export * from "./combat-action-properties.js";
export * from "./get-ability-mana-cost.js";
export * from "./combat-action-requires-melee-range.js";
export * from "./get-combat-action-execution-time.js";
export * from "./targeting-schemes-and-categories.js";

import { AbilityName } from "../../combatants";

export enum CombatActionType {
  AbilityUsed,
  ConsumableUsed,
}

export interface AbilityUsed {
  type: CombatActionType.AbilityUsed;
  abilityName: AbilityName;
}

export interface ConsumableUsed {
  type: CombatActionType.ConsumableUsed;
  itemId: string;
}

export type CombatAction = ConsumableUsed | AbilityUsed;
