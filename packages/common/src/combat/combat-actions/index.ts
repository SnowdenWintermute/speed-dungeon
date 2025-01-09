export * from "./combat-action-properties.js";
export * from "./get-ability-mana-cost.js";
export * from "./combat-action-requires-melee-range.js";
export * from "./get-combat-action-execution-time.js";
export * from "./targeting-schemes-and-categories.js";

import { AbilityName } from "../../combatants";
import { ConsumableType } from "../../items/consumables/index.js";

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
  // used on client for displaying dummy conusmables in the shop menu
  // otherwise we would just determine the consumable type by the itemId found in the inventory of the combatant
  consumableType?: ConsumableType;
}

export type CombatAction = ConsumableUsed | AbilityUsed;
