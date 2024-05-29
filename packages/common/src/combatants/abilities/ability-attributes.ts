import { CombatActionProperties } from "../../combat/combat-actions/combat-action-properties";

export default class CombatantAbilityAttributes {
  combatActionProperties: CombatActionProperties = new CombatActionProperties();
  isMelee: boolean = false;
  manaCost: number = 0;
  abilityLevelManaCostMultiplier: number = 1;
  combatantLevelManaCostMultiplier: number = 0;
  baseHpChangeValuesLevelMultiplier: number = 1.0;
  shardCost: number = 0;
  constructor() {}
}
