import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../app-consts.js";
import { CombatActionProperties } from "../../combat/combat-actions/combat-action-properties.js";

export default class AbilityAttributes {
  constructor(
    public combatActionProperties: CombatActionProperties,
    public manaCost: number = 0,
    public abilityLevelManaCostMultiplier: number = 1,
    public combatantLevelManaCostMultiplier: number = 0,
    public baseHpChangeValuesLevelMultiplier: number = 1.0,
    public shardCost: number = 0,
    public executionTime: number = DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME
  ) {}
}
