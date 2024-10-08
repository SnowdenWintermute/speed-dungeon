export * from "./calculate-combat-action-hp-change-range.js";
export * from "./combat-action-properties.js";
export * from "./get-ability-mana-cost.js";
export * from "./combat-action-requires-melee-range.js";
export * from "./get-combat-action-execution-time.js";

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
