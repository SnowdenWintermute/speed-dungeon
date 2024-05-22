import { CombatAttribute } from "./combatants/combat-attributes";

export const INVENTORY_DEFAULT_CAPACITY = 3;
export const DEEPEST_FLOOR = 10;
export const LEVEL_TO_REACH_FOR_ESCAPE = 6;
export const MAX_PARTY_SIZE = 3;

// EQUIPMENT
export const TWO_HANDED_WEAPON_ATTRIBUTE_MULTIPLIER = 1.75;

// ATTRIBUTES
export const DERIVED_ATTRIBUTE_RATIOS: Partial<
  Record<CombatAttribute, Partial<Record<CombatAttribute, number>>>
> = {
  [CombatAttribute.Dexterity]: {
    [CombatAttribute.Accuracy]: 2,
  },
  [CombatAttribute.Intelligence]: {
    [CombatAttribute.Mp]: 2,
  },
  [CombatAttribute.Agility]: {
    [CombatAttribute.Evasion]: 2,
    [CombatAttribute.Speed]: 1,
  },
  [CombatAttribute.Vitality]: {
    [CombatAttribute.Hp]: 2,
  },
};

export const DEX_TO_RANGED_ARMOR_PEN_RATIO = 1;
export const STR_TO_MELEE_ARMOR_PEN_RATIO = 1;
export const FOCUS_TO_CRIT_CHANCE_RATIO = 0.5;
export const VIT_TO_PERCENT_PHYSICAL_DAMAGE_REDUCTION_RATIO = 0.75;
export const OFF_HAND_ACCURACY_MODIFIER = 75;
export const OFF_HAND_DAMAGE_MODIFIER = 60;
export const TWO_HANDED_WEAPON_BASE_BONUS_DAMAGE_MODIFIER = 2;
export const RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO = 0.75;

// COMBAT
export const BASE_CRIT_CHANCE = 5;
export const MAX_CRIT_CHANCE = 95;
export const BASE_CRIT_MULTIPLIER = 1.5;
export const MULTI_TARGET_HP_CHANGE_BONUS = 0.15;
export const MIN_HIT_CHANCE = 5;
export const COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER = 30;
export const ARMOR_CLASS_EQUATION_MODIFIER = 2.5;

// 3D MODELS
export const COMBATANT_POSITION_SPACING_SIDE = 2.0;
export const COMBATANT_POSITION_SPACING_BETWEEN_ROWS = 5.0;
