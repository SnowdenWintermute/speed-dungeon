export const DESIGNED_HIT_CHANCE_FOR_AVERAGE_CHARACTER = 90;
export const DESIGNED_ACC_INVESTMENT_PERCENTAGE = 1 / 5;
export const DESIGNED_AGILITY_INVESTMENT_PERCENTAGE = 1 / 10;
export const FAST_AGILITY_INVESTMENT_PERCENTAGE = 0.3;
// turns taken by each speed tier for every turn the slow tier takes
export const DESIGNED_AVERAGE_TO_SLOW_TURN_RATIO = 1.34;
export const DESIGNED_FAST_TO_SLOW_TURN_RATIO = 1.66;
export const DESIGNED_FULLY_ALLOCATED_TO_SLOW_TURN_RATIO = 2.49;
export const DESIGNED_MAX_ATTAINABLE_TO_SLOWEST_TURN_RATIO = 3;
export const DESIGNED_OFFENSIVE_ALLOCATION_PERCENTAGE = 0.6;
// only scales the armor class affixes, since "allocation" on gear means which affixes you select
// on that gear regardless of base item
export const DESIGNED_ARMOR_CLASS_ALLOCATION_PERCENTAGE = 0.4;

export const DESIGNED_MONSTER_ARMOR_CLASS_DAMAGE_REDUCTION_PERCENT = {
  LOW: 0.1,
  MED: 0.25,
  HIGH: 0.5,
};

export const AVERAGE_MONSTER_ARMOR_CLASS_DAMAGE_REDUCTION_PERCENT =
  DESIGNED_MONSTER_ARMOR_CLASS_DAMAGE_REDUCTION_PERCENT.LOW;

export const DESIGNED_MONSTER_HIT_CHANCE_ON_TARGETS = {
  INACURATE: 0.5,
  AVERAGE: 0.8,
  ACCURATE: 0.95,
};

// target investment percentages (melee warrior)
// - damage - 6/10
//   - str - 4/10
//   - acc - 2/10
// - survivability - 3/10
//   - hp - 2/10
//   - eva/speed - 1/10
// - mana - 1/10
