export const INFO_UNICODE_SYMBOL = "ⓘ";

export const BASE_SCREEN_SIZE = 1920;
export const GOLDEN_RATIO = 657 / 1063;
export const INVENTORY_DEFAULT_CAPACITY = 20;
export const DEEPEST_FLOOR = 10;
export const EMPTY_ROOMS_PER_FLOOR = 0;
export const DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE = 4;
export const GAME_CONFIG = {
  MONSTER_LAIRS_PER_FLOOR: 3,
  LEVEL_TO_REACH_FOR_ESCAPE: DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE,
  MIN_RACE_GAME_PARTIES: 2,
};
export const MAX_PARTY_SIZE = 3;
// export const NUM_MONSTERS_PER_ROOM = 3;
export const NUM_MONSTERS_PER_ROOM = 3;
export const BASE_XP_PER_MONSTER = 30.0;
// export const BASE_XP_PER_MONSTER = 100.0;
export const BASE_XP_LEVEL_DIFF_MULTIPLIER = 0.25;

// EQUIPMENT
export const DEX_TO_RANGED_ARMOR_PEN_RATIO = 1;
export const STR_TO_MELEE_ARMOR_PEN_RATIO = 1;
export const FOCUS_TO_CRIT_CHANCE_RATIO = 0.5;
// export const VIT_TO_PERCENT_PHYSICAL_DAMAGE_REDUCTION_RATIO = 0.75;
export const OFF_HAND_ACCURACY_MODIFIER = 75;
export const OFF_HAND_DAMAGE_MODIFIER = 60;
export const OFF_HAND_CRIT_CHANCE_MODIFIER = 60;
export const TWO_HANDED_WEAPON_BASE_BONUS_DAMAGE_MODIFIER = 2;
export const TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER = 2;
export const RESILIENCE_TO_PERCENT_MAGICAL_DAMAGE_REDUCTION_RATIO = 2;
export const RESILIENCE_TO_PERCENT_MAGICAL_HEALING_INCREASE_RATIO = 4;
export const CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO = 0.5;

// EQUIPMENT GENERATION
export const BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL = 0.75;
export const CHANCE_FOR_ITEM_TO_BE_NON_MAGICAL = 1 - BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL;
export const CHANCE_TO_HAVE_PREFIX = 0.208;
export const CHANCE_TO_HAVE_SUFFIX = 0.625;
export const CHANCE_TO_HAVE_DOUBLE_AFFIX = 0.167;
export const FOUND_ITEM_MAX_DURABILITY_MODIFIER = 0.75;
export const FOUND_ITEM_MIN_DURABILITY_MODIFIER = 0.25;
// CRAFTING
// go to crafting actions for the related consts

// COMBAT
export const BASE_CRIT_CHANCE = 5;
export const MAX_CRIT_CHANCE = 95;
export const BASE_CRIT_MULTIPLIER = 1.5;
export const MULTI_TARGET_HP_CHANGE_BONUS = 0.15;
export const MIN_HIT_CHANCE = 5;
export const COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER = 30;
export const ARMOR_CLASS_EQUATION_MODIFIER = 2.5;

// 3D MODELS
export const COMBATANT_POSITION_SPACING_SIDE = 1.4;
export const COMBATANT_POSITION_SPACING_BETWEEN_ROWS = 5.0;
export const COMBATANT_TIME_TO_MOVE_ONE_METER = 300;
export const COMBATANT_TIME_TO_ROTATE_360 = 1000;
export const MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME = 1000;
export const DEFAULT_HITBOX_RADIUS_FALLBACK = 1.5;
export const DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME = 1000;

// ACCOUNTS AND PROFILES
export const DEFAULT_ACCOUNT_CHARACTER_CAPACITY = 3;
export const LADDER_PAGE_SIZE = 20;
export const RACE_GAME_RECORDS_PAGE_SIZE = 3;

// VALIDATION
export const MAX_CHARACTER_NAME_LENGTH = 32;
export const MAX_GAME_NAME_LENGTH = 128;
export const MAX_PARTY_NAME_LENGTH = 128;

export const FFIX_COLORS = {
  beigepaper: "#988962",
  firered: "#ad252f",
  iceblue: "#2b9799",
  windgreen: "#2faa36",
  earthyellow: "#afa915",
  lightningpurple: "#703c91",
  waterblue: "#332e92",
  darknessblack: "#2e2514",
  lightwhite: "#a7a08d",
  ffxipink: "#ff9b9b",
};

export const CONSUMABLE_TURQUOISE = "#0d6658";
export const CONSUMABLE_TEXT_COLOR = "text-teal-400";
export const MAGICAL_PROPERTY_BLUE = "#93c5fd";
export const MAGICAL_PROPERTY_BLUE_TEXT = "text-blue-300";
export const BASE_TEXT = "#d4d4d8";

export enum DungeonFloor {
  Zero,
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
}

export const SKY_COLORS_BY_FLOOR: Record<DungeonFloor, string> = {
  [DungeonFloor.Zero]: "#1a1a26",
  [DungeonFloor.One]: "#1a1a26",
  [DungeonFloor.Two]: "#1A3636",
  [DungeonFloor.Three]: "#697565",
  [DungeonFloor.Four]: "#393646",
  [DungeonFloor.Five]: "#1A120B",
  [DungeonFloor.Six]: "#3C2A21",
  [DungeonFloor.Seven]: "#2D3250",
  [DungeonFloor.Eight]: "#1B4242",
  [DungeonFloor.Nine]: "#344955",
  [DungeonFloor.Ten]: "#424769",
};

export const ONE_THIRD_OF_ONE = 1 / 3;
