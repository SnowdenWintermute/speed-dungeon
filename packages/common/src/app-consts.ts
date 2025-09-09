import { Meters, Milliseconds } from "./primatives/index.js";

// remember to update it in package.json as well!
export const APP_VERSION_NUMBER = "0.11.0";

export const INFO_UNICODE_SYMBOL = "ⓘ";

export const ONE_SECOND: Milliseconds = 1000;
export const SIMULATION_FPS: Milliseconds = 15;
export const TICK_LENGTH: Milliseconds = ONE_SECOND / SIMULATION_FPS;

export const BASE_SCREEN_SIZE = 1920;
export const GOLDEN_RATIO = 657 / 1063;
export const INVENTORY_DEFAULT_CAPACITY = 20;
export const DEEPEST_FLOOR = 10;
export const EMPTY_ROOMS_PER_FLOOR = 0;
export const DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE = 4;
export const GAME_CONFIG = {
  MONSTER_LAIRS_PER_FLOOR: 2,
  LEVEL_TO_REACH_FOR_ESCAPE: DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE,
  MIN_RACE_GAME_PARTIES: 2,
};
export const MAX_PARTY_SIZE = 3;
export const NUM_MONSTERS_PER_ROOM = 2;
// export const NUM_MONSTERS_PER_ROOM = 1;
export const BASE_XP_PER_MONSTER = 30.0;
// export const BASE_XP_PER_MONSTER = 100.0;
export const BASE_XP_LEVEL_DIFF_MULTIPLIER = 0.25;

export const COMBATANT_MAX_LEVEL = 10;
export const COMBATANT_MAX_ACTION_POINTS = 2;
export const HOTSWAP_SLOT_SELECTION_ACTION_POINT_COST = 1;

// UI
export const FLOATING_MESSAGE_DURATION: Milliseconds = 2000;

// EQUIPMENT
export const DEX_TO_RANGED_ARMOR_PEN_RATIO = 1;
export const STR_TO_MELEE_ARMOR_PEN_RATIO = 1;
export const FOCUS_TO_CRIT_CHANCE_RATIO = 0.5;
// export const VIT_TO_PERCENT_PHYSICAL_DAMAGE_REDUCTION_RATIO = 0.75;
export const OFF_HAND_ACCURACY_MODIFIER = 0.75;
export const OFF_HAND_DAMAGE_MODIFIER = 0.6;
export const OFF_HAND_CRIT_CHANCE_MODIFIER = 0.6;
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

// ABILITIES
export const MAX_ALLOCATABLE_ACTION_LEVEL = 3;

// COMBAT
export const BASE_CRIT_CHANCE = 5;
export const MAX_CRIT_CHANCE = 95;
export const BASE_CRIT_MULTIPLIER = 1.5;
export const MULTI_TARGET_RESOURCE_CHANGE_BONUS = 0.15;
export const MIN_HIT_CHANCE = 5;
export const COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER = 20;
export const ARMOR_CLASS_EQUATION_MODIFIER = 2.5;

export const MELEE_START_ATTACK_RANGE = 0.5;

// 3D MODELS
export const GRAVITY = -9.81;
export const DEBUG_ANIMATION_SPEED_MULTIPLIER = 1; // default is 1, higher is slower;

export const COMBATANT_POSITION_SPACING_SIDE: Meters = 1.6;
// export const COMBATANT_POSITION_SPACING_SIDE: Meters = 3.4;
export const BASE_EXPLOSION_RADIUS: Meters = COMBATANT_POSITION_SPACING_SIDE + 0.2;
export const COMBATANT_POSITION_SPACING_BETWEEN_ROWS: Meters = 5.0;
// export const COMBATANT_POSITION_SPACING_BETWEEN_ROWS: Meters = 13;
export const COMBATANT_TIME_TO_MOVE_ONE_METER = 300 * DEBUG_ANIMATION_SPEED_MULTIPLIER;
// export const COMBATANT_TIME_TO_MOVE_ONE_METER = 100;
// export const ARROW_TIME_TO_MOVE_ONE_METER = 800;
export const ARROW_TIME_TO_MOVE_ONE_METER = 65 * DEBUG_ANIMATION_SPEED_MULTIPLIER;
export const COMBATANT_TIME_TO_ROTATE_360 = 1000 * DEBUG_ANIMATION_SPEED_MULTIPLIER;
export const MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME =
  1000 * DEBUG_ANIMATION_SPEED_MULTIPLIER;
export const DEFAULT_HITBOX_RADIUS_FALLBACK = 1.5;

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
  [DungeonFloor.Zero]: "#1e293b",
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

export enum SkeletalAnimationName {
  StartMovingForward,
  MoveForwardLoop,
  MoveBack,
  IdleUnarmed,
  IdleMainHand,
  IdleDualWield,
  IdleTwoHand,
  IdleBow,
  DeathFront,
  DeathBack,
  HitRecovery,
  CritRecovery,
  Evade,
  Parry,
  Block,
  MainHandSwingChambering,
  MainHandSwingDelivery,
  MainHandSwingRecovery,
  OffHandSwingChambering,
  OffHandSwingDelivery,
  OffHandSwingRecovery,
  TwoHandSwingChambering,
  TwoHandSwingDelivery,
  TwoHandSwingRecovery,
  MainHandStabChambering,
  MainHandStabDelivery,
  MainHandStabRecovery,
  OffHandStabChambering,
  OffHandStabDelivery,
  OffHandStabRecovery,
  MainHandUnarmedChambering,
  MainHandUnarmedDelivery,
  MainHandUnarmedRecovery,
  OffHandUnarmedChambering,
  OffHandUnarmedDelivery,
  OffHandUnarmedRecovery,
  TwoHandStabChambering,
  TwoHandStabDelivery,
  TwoHandStabRecovery,
  BowPrep,
  BowChambering,
  BowDelivery,
  BowRecovery,
  EquipmentShortBowShoot,
  EquipmentMilitaryBowShoot,
  EquipmentEtherBowShoot,
  EquipmentRecurveBowShoot,
  EquipmentCompositeBowShoot,
  CastSpellChambering,
  CastSpellDelivery,
  CastSpellRecovery,
  UseConsumableChambering,
  UseConsumableDelivery,
  UseConsumableRecovery,
}

export enum DynamicAnimationName {
  ExplosionDelivery,
  ExplosionDissipation,
  IceBurstDelivery,
  IceBurstDissipation,
}

export const SKELETAL_ANIMATION_NAME_STRINGS: Record<SkeletalAnimationName, string> = {
  [SkeletalAnimationName.StartMovingForward]: "sprint-loop",
  [SkeletalAnimationName.MoveForwardLoop]: "sprint-loop",
  [SkeletalAnimationName.MoveBack]: "run-back",
  [SkeletalAnimationName.IdleUnarmed]: "idle-unarmed",
  [SkeletalAnimationName.IdleMainHand]: "idle-1h",
  [SkeletalAnimationName.IdleDualWield]: "idle-dual-wield",
  [SkeletalAnimationName.IdleTwoHand]: "idle-2h",
  [SkeletalAnimationName.IdleBow]: "idle-bow",
  [SkeletalAnimationName.DeathFront]: "death-2",
  [SkeletalAnimationName.DeathBack]: "death-1",
  [SkeletalAnimationName.HitRecovery]: "hit-recovery",
  [SkeletalAnimationName.CritRecovery]: "crit-recovery",
  [SkeletalAnimationName.Evade]: "evade-full",
  [SkeletalAnimationName.Parry]: "1h-parry-full",
  [SkeletalAnimationName.Block]: "shield-block-recovery",
  [SkeletalAnimationName.MainHandSwingChambering]: "mh-swing-chambering",
  [SkeletalAnimationName.MainHandSwingDelivery]: "mh-swing-delivery",
  [SkeletalAnimationName.MainHandSwingRecovery]: "mh-swing-recovery",
  [SkeletalAnimationName.OffHandSwingChambering]: "oh-swing-chambering",
  [SkeletalAnimationName.OffHandSwingDelivery]: "oh-swing-delivery",
  [SkeletalAnimationName.OffHandSwingRecovery]: "oh-swing-recovery",
  [SkeletalAnimationName.TwoHandSwingChambering]: "2h-swing-chambering",
  [SkeletalAnimationName.TwoHandSwingDelivery]: "2h-swing-delivery",
  [SkeletalAnimationName.TwoHandSwingRecovery]: "2h-swing-recovery",
  [SkeletalAnimationName.MainHandStabChambering]: "mh-stab-chambering",
  [SkeletalAnimationName.MainHandStabDelivery]: "mh-stab-delivery",
  [SkeletalAnimationName.MainHandStabRecovery]: "mh-stab-recovery",
  [SkeletalAnimationName.MainHandUnarmedChambering]: "mh-unarmed-strike-chambering",
  [SkeletalAnimationName.MainHandUnarmedDelivery]: "mh-unarmed-strike-delivery",
  [SkeletalAnimationName.MainHandUnarmedRecovery]: "mh-unarmed-strike-recovery",
  [SkeletalAnimationName.OffHandStabChambering]: "oh-stab-chambering",
  [SkeletalAnimationName.OffHandStabDelivery]: "oh-stab-delivery",
  [SkeletalAnimationName.OffHandStabRecovery]: "oh-stab-recovery",
  [SkeletalAnimationName.OffHandUnarmedChambering]: "oh-unarmed-strike-chambering",
  [SkeletalAnimationName.OffHandUnarmedDelivery]: "oh-unarmed-strike-delivery",
  [SkeletalAnimationName.OffHandUnarmedRecovery]: "oh-unarmed-strike-recovery",
  [SkeletalAnimationName.TwoHandStabChambering]: "2h-stab-chambering",
  [SkeletalAnimationName.TwoHandStabDelivery]: "2h-stab-delivery",
  [SkeletalAnimationName.TwoHandStabRecovery]: "2h-stab-recovery",
  [SkeletalAnimationName.BowPrep]: "bow-shoot-prep",
  [SkeletalAnimationName.BowChambering]: "bow-shoot-chambering",
  [SkeletalAnimationName.BowDelivery]: "bow-shoot-delivery",
  [SkeletalAnimationName.BowRecovery]: "bow-shoot-recovery",
  [SkeletalAnimationName.CastSpellChambering]: "spell-chambering",
  [SkeletalAnimationName.CastSpellDelivery]: "spell-delivery",
  [SkeletalAnimationName.CastSpellRecovery]: "spell-recovery",
  [SkeletalAnimationName.UseConsumableChambering]: "use-consumable-chambering",
  [SkeletalAnimationName.UseConsumableDelivery]: "use-consumable-delivery",
  [SkeletalAnimationName.UseConsumableRecovery]: "use-consumable-recovery",
  [SkeletalAnimationName.EquipmentShortBowShoot]: "short-bow-shoot-baked",
  [SkeletalAnimationName.EquipmentMilitaryBowShoot]: "military-bow-shoot-baked",
  [SkeletalAnimationName.EquipmentEtherBowShoot]: "ether-bow-shoot-baked",
  [SkeletalAnimationName.EquipmentRecurveBowShoot]: "recurve-bow-shoot-baked",
  [SkeletalAnimationName.EquipmentCompositeBowShoot]: "composite-bow-shoot-baked",
};

export const DYNAMIC_ANIMATION_NAME_STRINGS: Record<DynamicAnimationName, string> = {
  [DynamicAnimationName.ExplosionDelivery]: "explosion-delivery",
  [DynamicAnimationName.ExplosionDissipation]: "explosion-dissipation",
  [DynamicAnimationName.IceBurstDelivery]: "ice-burst-delivery",
  [DynamicAnimationName.IceBurstDissipation]: "ice-burst-dissipation",
};

export enum AnimationType {
  Skeletal,
  Dynamic,
}

export type SkeletalAnimationIdentifier = {
  type: AnimationType.Skeletal;
  name: SkeletalAnimationName;
};
export type DynamicAnimationIdentifier = {
  type: AnimationType.Dynamic;
  name: DynamicAnimationName;
};

export type TaggedAnimationName = SkeletalAnimationIdentifier | DynamicAnimationIdentifier;
