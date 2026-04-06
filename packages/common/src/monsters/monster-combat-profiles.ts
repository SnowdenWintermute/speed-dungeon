import { AiType } from "../combat/ai-behavior/index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { MonsterType } from "./monster-types.js";

export interface MonsterCombatProfile {
  actions: { name: CombatActionName; rank?: number }[];
  aiTypes: AiType[];
}

export const BASIC_AI_PRIORITY = [
  AiType.TargetTopOfThreatMeter,
  AiType.TargetLowestHpEnemy,
  AiType.RandomMaliciousAction,
];

export const MONSTER_COMBAT_PROFILES: Record<MonsterType, MonsterCombatProfile> = {
  [MonsterType.Cultist]: {
    actions: [
      { name: CombatActionName.Attack },
      { name: CombatActionName.Healing },
      { name: CombatActionName.Fire },
      { name: CombatActionName.IceBoltParent },
    ],
    aiTypes: [AiType.Healer, ...BASIC_AI_PRIORITY],
  },
  [MonsterType.MantaRay]: {
    actions: [
      { name: CombatActionName.Attack },
      { name: CombatActionName.Healing, rank: 2 },
      { name: CombatActionName.IceBoltParent },
    ],
    aiTypes: [AiType.Healer, AiType.PrefersAttackWithMana, ...BASIC_AI_PRIORITY],
  },
  [MonsterType.Spider]: {
    actions: [
      { name: CombatActionName.Attack },
      { name: CombatActionName.Healing },
      { name: CombatActionName.Ensnare },
    ],
    aiTypes: [AiType.PrefersAttackWithMana, ...BASIC_AI_PRIORITY],
  },
  [MonsterType.Wolf]: {
    actions: [{ name: CombatActionName.Attack }, { name: CombatActionName.Healing }],
    aiTypes: [...BASIC_AI_PRIORITY],
  },
  [MonsterType.FireMage]: {
    actions: [{ name: CombatActionName.Attack }, { name: CombatActionName.Healing }],
    aiTypes: [...BASIC_AI_PRIORITY],
  },
  [MonsterType.Net]: {
    actions: [],
    aiTypes: [],
  },
};
